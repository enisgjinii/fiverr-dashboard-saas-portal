import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Download, 
  FileText, 
  FileJson, 
  Paperclip, 
  Users, 
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Types
interface Attachment {
  filename: string;
  downloadUrl: string;
  fileSize: number;
  contentType?: string;
}

interface Message {
  sender: string;
  recipient: string;
  body: string;
  createdAt: number;
  attachments?: Attachment[];
  repliedToMessage?: {
    sender: string;
    body: string;
    createdAt: number;
  };
}

interface ConversationData {
  conversationId: string;
  messages: Message[];
}

interface Contact {
  username: string;
  recentMessageDate: number;
}

type StatusType = 'success' | 'error' | 'progress' | 'idle';

// Utility functions
function formatFileSize(bytes: number): string {
  if (!bytes || isNaN(bytes)) return 'size unknown';
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

// Chrome API types
declare const chrome: {
  storage: {
    local: {
      get: (keys: string | string[]) => Promise<Record<string, any>>;
      set: (items: Record<string, any>) => Promise<void>;
    };
  };
  tabs: {
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<Array<{ id?: number; url?: string }>>;
    sendMessage: (tabId: number, message: any) => Promise<void>;
    create: (options: { url: string }) => Promise<void>;
  };
  runtime: {
    sendMessage: (message: any) => Promise<void>;
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
      removeListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
    };
  };
  downloads: {
    download: (options: { url: string; filename: string; saveAs: boolean }) => Promise<void>;
  };
};

export default function App() {
  // State
  const [status, setStatus] = useState<{ message: string; type: StatusType }>({ message: '', type: 'idle' });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contactsProgress, setContactsProgress] = useState<{ current: number; total: number } | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<string>('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [isOnFiverr, setIsOnFiverr] = useState(false);

  // Update status message
  const updateStatus = useCallback((message: string, type: StatusType = 'success') => {
    setStatus({ message, type });
  }, []);

  // Initialize popup
  useEffect(() => {
    const init = async () => {
      try {
        // Check if we're on Fiverr
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tabs[0].url || '';
        const onFiverr = currentUrl.includes('fiverr.com');
        setIsOnFiverr(onFiverr);

        if (!onFiverr) {
          updateStatus('Please navigate to Fiverr to use this extension.', 'error');
          return;
        }

        updateStatus('Ready to extract Fiverr data.', 'success');

        // Load stored data
        const result = await chrome.storage.local.get([
          'allContacts', 
          'lastContactsFetch', 
          'lastContactCount',
          'conversationData',
          'currentUsername',
          'markdownContent',
          'jsonContent',
          'currentConversationUsername'
        ]);

        if (result.allContacts && result.allContacts.length > 0) {
          setContacts(result.allContacts);
        }

        if (result.conversationData) {
          setConversationData(result.conversationData);
          if (result.currentUsername) {
            setCurrentUsername(result.currentUsername);
          }
        }

        if (result.markdownContent) {
          setMarkdownContent(result.markdownContent);
        }

        if (result.jsonContent) {
          setJsonContent(result.jsonContent);
        }

        if (result.currentConversationUsername) {
          setCurrentUsername(result.currentConversationUsername);
        }

        // Initialize connection with background script
        chrome.runtime.sendMessage({ type: 'INIT_POPUP' });
      } catch (error) {
        console.error('Error initializing popup:', error);
        updateStatus('Error initializing extension.', 'error');
      }
    };

    init();
  }, [updateStatus]);

  // Listen for messages from background script
  useEffect(() => {
    const messageListener = (request: any) => {
      switch (request.type) {
        case 'CONTACTS_PROGRESS':
          updateStatus(request.message, 'progress');
          if (request.totalContacts) {
            setContactsProgress({ current: request.totalContacts, total: request.totalContacts });
          }
          break;
        
        case 'CONTACTS_FETCHED':
          updateStatus(request.message, 'success');
          if (request.data) {
            setContacts(request.data);
            setContactsProgress(null);
          }
          break;
        
        case 'CONVERSATION_EXTRACTED':
          handleConversationExtracted(request.data, request.message);
          break;
        
        case 'EXTRACTION_ERROR':
          updateStatus(request.error, 'error');
          setIsLoading(false);
          break;

        case 'EXTRACTION_PROGRESS':
          setExtractionProgress(request.message);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [updateStatus]);

  // Handle conversation extracted
  const handleConversationExtracted = useCallback((data: ConversationData, message: string) => {
    updateStatus(message || 'Conversation extracted successfully!', 'success');
    
    setConversationData(data);
    
    // Extract username from message
    const usernameMatch = message?.match(/Conversation with (.+) extracted successfully!/);
    const username = usernameMatch ? usernameMatch[1] : '';
    
    if (username) {
      setCurrentUsername(username);
    }
    
    setIsLoading(false);
    setExtractionProgress('');
  }, [updateStatus]);

  // Fetch all contacts
  const handleFetchContacts = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0].url || '';
      
      if (!currentUrl.includes('fiverr.com')) {
        updateStatus('Please navigate to Fiverr first.', 'error');
        return;
      }
      
      setIsLoading(true);
      setContactsProgress({ current: 0, total: 0 });
      updateStatus('Fetching all contacts...', 'progress');
      chrome.runtime.sendMessage({ type: 'FETCH_ALL_CONTACTS' });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      updateStatus('Error fetching contacts.', 'error');
      setIsLoading(false);
    }
  };

  // Extract conversation
  const handleExtractConversation = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tabs[0].url || '';
      
      // Only allow extraction from specific inbox URL format
      const match = url.match(/^https:\/\/www\.fiverr\.com\/inbox\/([^\/\?]+)$/);
      if (!match) {
        updateStatus('Please open a specific inbox URL (e.g., https://www.fiverr.com/inbox/username)', 'error');
        return;
      }

      const username = match[1];
      await chrome.storage.local.set({ currentUsername: username });
      setCurrentUsername(username);
      setIsLoading(true);
      setExtractionProgress('Starting extraction...');
      updateStatus('Extracting conversation...', 'progress');
      chrome.runtime.sendMessage({ type: 'EXTRACT_CONVERSATION' });
    } catch (error) {
      console.error('Error extracting conversation:', error);
      updateStatus('Error extracting conversation.', 'error');
      setIsLoading(false);
    }
  };

  // Download markdown
  const handleDownloadMarkdown = async () => {
    try {
      const result = await chrome.storage.local.get(['markdownContent', 'currentUsername']);
      if (result.markdownContent && result.currentUsername) {
        const blob = new Blob([result.markdownContent], { type: 'text/markdown' });
        await chrome.downloads.download({
          url: URL.createObjectURL(blob),
          filename: `${result.currentUsername}/conversations/fiverr_conversation_${result.currentUsername}_${new Date().toISOString().split('T')[0]}.md`,
          saveAs: false
        });
        updateStatus('Markdown downloaded successfully!', 'success');
      } else {
        updateStatus('Please extract the conversation first.', 'error');
      }
    } catch (error) {
      console.error('Error downloading markdown:', error);
      updateStatus('Error downloading markdown.', 'error');
    }
  };

  // View markdown
  const handleViewMarkdown = async () => {
    try {
      const result = await chrome.storage.local.get(['markdownContent']);
      if (result.markdownContent) {
        const blob = new Blob([result.markdownContent], { type: 'text/markdown' });
        await chrome.tabs.create({ url: URL.createObjectURL(blob) });
      } else {
        updateStatus('Please extract the conversation first.', 'error');
      }
    } catch (error) {
      console.error('Error viewing markdown:', error);
      updateStatus('Error viewing markdown.', 'error');
    }
  };

  // Download JSON
  const handleDownloadJson = async () => {
    try {
      const result = await chrome.storage.local.get(['jsonContent', 'currentUsername']);
      if (result.jsonContent && result.currentUsername) {
        const blob = new Blob([JSON.stringify(result.jsonContent, null, 2)], { type: 'application/json' });
        await chrome.downloads.download({
          url: URL.createObjectURL(blob),
          filename: `${result.currentUsername}/conversations/${result.currentUsername}_conversation.json`,
          saveAs: false
        });
        updateStatus('JSON downloaded successfully!', 'success');
      } else {
        updateStatus('Please extract the conversation first.', 'error');
      }
    } catch (error) {
      console.error('Error downloading JSON:', error);
      updateStatus('Error downloading JSON.', 'error');
    }
  };

  // View JSON
  const handleViewJson = async () => {
    try {
      const result = await chrome.storage.local.get(['jsonContent']);
      if (result.jsonContent) {
        const blob = new Blob([JSON.stringify(result.jsonContent, null, 2)], { type: 'application/json' });
        await chrome.tabs.create({ url: URL.createObjectURL(blob) });
      } else {
        updateStatus('Please extract the conversation first.', 'error');
      }
    } catch (error) {
      console.error('Error viewing JSON:', error);
      updateStatus('Error viewing JSON.', 'error');
    }
  };

  // Download attachment
  const handleDownloadAttachment = async (attachment: Attachment, username: string) => {
    try {
      await chrome.downloads.download({
        url: attachment.downloadUrl,
        filename: `${username}/attachments/${attachment.filename}`,
        saveAs: false
      });
    } catch (error) {
      console.error('Error downloading attachment:', error);
      updateStatus('Error downloading attachment.', 'error');
    }
  };

  // Select contact
  const handleSelectContact = async (contact: Contact) => {
    try {
      await chrome.storage.local.set({ currentUsername: contact.username });
      setCurrentUsername(contact.username);
      setIsLoading(true);
      setExtractionProgress('Starting extraction...');
      updateStatus(`Extracting conversation with ${contact.username}...`, 'progress');
      chrome.runtime.sendMessage({ type: 'EXTRACT_CONVERSATION' });
    } catch (error) {
      console.error('Error selecting contact:', error);
      updateStatus('Error selecting contact.', 'error');
      setIsLoading(false);
    }
  };

  // Get all attachments from conversation
  const getAllAttachments = (): Array<{ attachment: Attachment; sender: string }> => {
    if (!conversationData?.messages) return [];
    
    const attachments: Array<{ attachment: Attachment; sender: string }> = [];
    conversationData.messages.forEach(message => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
          attachments.push({ attachment, sender: message.sender });
        });
      }
    });
    return attachments;
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status.type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="w-[400px] min-h-[500px] bg-background">
        <Tabs defaultValue="contacts" className="w-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Fiverr Extractor
              </h1>
              <Badge variant={isOnFiverr ? "default" : "destructive"}>
                {isOnFiverr ? "Connected" : "Not on Fiverr"}
              </Badge>
            </div>
            
            {status.message && (
              <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                status.type === 'error' ? 'bg-destructive/10 text-destructive' :
                status.type === 'success' ? 'bg-green-500/10 text-green-600' :
                status.type === 'progress' ? 'bg-blue-500/10 text-blue-600' :
                'bg-muted text-muted-foreground'
              }`}>
                {getStatusIcon()}
                {status.message}
              </div>
            )}
          </div>

          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="conversation" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="exports" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="p-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Contacts</CardTitle>
                <CardDescription className="text-xs">
                  {contacts.length > 0 ? `${contacts.length} contacts loaded` : 'No contacts loaded'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleFetchContacts} 
                  disabled={isLoading || !isOnFiverr}
                  className="w-full mb-4"
                  variant={contacts.length > 0 ? "outline" : "default"}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {contacts.length > 0 ? 'Refresh Contacts' : 'Fetch All Contacts'}
                    </>
                  )}
                </Button>

                {contactsProgress && (
                  <div className="mb-4">
                    <Progress value={contactsProgress.total > 0 ? (contactsProgress.current / contactsProgress.total) * 100 : 0} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {contactsProgress.current} / {contactsProgress.total} contacts
                    </p>
                  </div>
                )}

                <ScrollArea className="h-[300px]">
                  {contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Users className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No contacts found</p>
                      <p className="text-xs">Click "Fetch All Contacts" to start</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contacts.map((contact, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectContact(contact)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                            currentUsername === contact.username ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{contact.username}</span>
                            {currentUsername === contact.username && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last message: {formatDate(contact.recentMessageDate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversation" className="p-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">Current Conversation</CardTitle>
                    <CardDescription className="text-xs">
                      {currentUsername ? `Chat with ${currentUsername}` : 'No conversation selected'}
                    </CardDescription>
                  </div>
                  {currentUsername && (
                    <Badge variant="outline">{currentUsername}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleExtractConversation} 
                  disabled={isLoading || !isOnFiverr}
                  className="w-full mb-4"
                  variant={conversationData ? "outline" : "default"}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {extractionProgress || 'Extracting...'}
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {conversationData ? 'Re-extract Conversation' : 'Extract Conversation'}
                    </>
                  )}
                </Button>

                {conversationData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{conversationData.messages.length}</p>
                        <p className="text-xs text-muted-foreground">Messages</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{getAllAttachments().length}</p>
                        <p className="text-xs text-muted-foreground">Attachments</p>
                      </div>
                    </div>

                    {getAllAttachments().length > 0 && (
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-between"
                          onClick={() => setShowAttachments(!showAttachments)}
                        >
                          <span className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            Attachments ({getAllAttachments().length})
                          </span>
                          {showAttachments ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {showAttachments && (
                          <ScrollArea className="h-[200px] mt-2">
                            <div className="space-y-2">
                              {getAllAttachments().map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.attachment.filename}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(item.attachment.fileSize)} • {item.sender}
                                    </p>
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDownloadAttachment(item.attachment, currentUsername)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Download attachment</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">Message Preview</h4>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {conversationData.messages.slice(0, 5).map((message, index) => (
                            <div key={index} className="p-2 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">{message.sender}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(message.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm line-clamp-2">{message.body}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {conversationData.messages.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          And {conversationData.messages.length - 5} more messages...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!conversationData && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No conversation loaded</p>
                    <p className="text-xs">Select a contact or extract from current page</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exports" className="p-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Export Options</CardTitle>
                <CardDescription className="text-xs">
                  Download or view extracted data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleDownloadMarkdown}
                    disabled={!markdownContent}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <Download className="h-6 w-6" />
                    <span className="text-xs">Download MD</span>
                  </Button>
                  
                  <Button
                    onClick={handleViewMarkdown}
                    disabled={!markdownContent}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <Eye className="h-6 w-6" />
                    <span className="text-xs">View MD</span>
                  </Button>
                  
                  <Button
                    onClick={handleDownloadJson}
                    disabled={!jsonContent}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <FileJson className="h-6 w-6" />
                    <span className="text-xs">Download JSON</span>
                  </Button>
                  
                  <Button
                    onClick={handleViewJson}
                    disabled={!jsonContent}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-xs">View JSON</span>
                  </Button>
                </div>

                {!markdownContent && !jsonContent && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No data to export</p>
                    <p className="text-xs">Extract a conversation first</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
