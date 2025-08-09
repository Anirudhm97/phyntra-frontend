import React, { useState, useRef } from 'react';

// API Configuration - Updated with your Vercel backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://phyntra-backend.onrender.com'
  : 'http://localhost:8000/api';

const App = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Welcome to Phyntra! 👋 I\'m here to help you process invoices. Upload your documents and I\'ll extract all the key information for you.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // API Functions
  const uploadInvoice = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/process-invoice`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'user',
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Simulate bot response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          content: 'I understand you want to process invoices. Please upload your documents using the upload button and I\'ll extract all the key information for you!',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, 1000);
      
      setInputMessage('');
    }
  };

  const handleFileUpload = async (files) => {
    const fileList = Array.from(files);
    
    for (const file of fileList) {
      // Add user message
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'user',
        content: `📄 Uploaded: ${file.name}`,
        timestamp: new Date().toLocaleTimeString(),
        file: file
      }]);
      
      // Add processing message
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'bot',
        content: `🔄 Processing ${file.name}... Extracting invoice data now.`,
        timestamp: new Date().toLocaleTimeString(),
        processing: true
      }]);

      setIsProcessing(true);

      try {
        const result = await uploadInvoice(file);
        
        if (result.success) {
          // Success message with extracted data
          const invoiceData = result.data;
          const itemsCount = invoiceData.Items?.length || 0;
          
          let responseMessage = `✅ Successfully extracted data from ${file.name}!\n\n📋 **Invoice Details:**\n`;
          responseMessage += `• Invoice #: ${invoiceData.Invoice_Number || 'Not found'}\n`;
          responseMessage += `• Date: ${invoiceData.Invoice_Date || 'Not found'}\n`;
          responseMessage += `• Vendor: ${invoiceData.Vendor_Name || 'Not found'}\n`;
          responseMessage += `• Vendor GSTIN: ${invoiceData.Vendor_GSTIN || 'Not found'}\n`;
          responseMessage += `• Buyer: ${invoiceData.Buyer_Name || 'Not found'}\n`;
          responseMessage += `• Items: ${itemsCount} line item(s)\n`;
          
          if (itemsCount > 0) {
            responseMessage += `\n**Line Items:**\n`;
            invoiceData.Items.forEach((item, index) => {
              if (item.Items) {
                responseMessage += `${index + 1}. ${item.Items}`;
                if (item.Qty) responseMessage += ` (Qty: ${item.Qty})`;
                if (item.Rate) responseMessage += ` @ ₹${item.Rate}`;
                responseMessage += `\n`;
              }
            });
          }
          
          responseMessage += `\nData has been saved to the database. You can approve or reject this processing.`;
          
          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: responseMessage,
            timestamp: new Date().toLocaleTimeString(),
            invoiceData: invoiceData,
            fileHash: result.file_hash
          }]);
        } else {
          throw new Error(result.message || 'Processing failed');
        }
      } catch (error) {
        // Error message
        let errorMessage = `❌ Failed to process ${file.name}.`;
        
        if (error.message.includes('API key')) {
          errorMessage += '\n\nError: OpenAI API key not configured. Please contact administrator.';
        } else if (error.message.includes('Rate limit')) {
          errorMessage += '\n\nError: API rate limit reached. Please try again in a few minutes.';
        } else if (error.message.includes('File too large')) {
          errorMessage += '\n\nError: File is too large. Maximum size is 10MB.';
        } else if (error.message.includes('File type not supported')) {
          errorMessage += '\n\nError: File type not supported. Please use PDF, JPG, or PNG files.';
        } else {
          errorMessage += `\n\nError: ${error.message}`;
        }
        
        errorMessage += '\n\nPlease try again with a clearer image or different format.';
        
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: errorMessage,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const sidebarItems = [
    { icon: '🏠', label: 'Dashboard', count: null },
    { icon: '📄', label: 'Processed', count: '12' },
    { icon: '⏰', label: 'Pending', count: '3' },
    { icon: '📥', label: 'Downloads', count: null },
    { icon: '📊', label: 'Analytics', count: null },
    { icon: '⚙️', label: 'Settings', count: null },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo">P</div>
            <div>
              <h1 style={{fontSize: '20px', fontWeight: 'bold', color: '#1f2937'}}>Phyntra</h1>
              <p style={{fontSize: '14px', color: '#6b7280'}}>AI Document Intelligence</p>
            </div>
          </div>
        </div>
        
        <nav style={{padding: '16px 0', flex: 1}}>
          {sidebarItems.map((item, index) => (
            <div key={index} className="nav-item">
              <span>{item.icon} {item.label}</span>
              {item.count && <span className="badge">{item.count}</span>}
            </div>
          ))}
        </nav>

        <div style={{padding: '16px', borderTop: '1px solid rgba(0,0,0,0.1)'}}>
          <div className="nav-item">
            <span>👤 John Doe</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div>
            <h2 style={{fontSize: '18px', fontWeight: '600', color: '#1f2937'}}>Phyntra</h2>
            <p style={{fontSize: '14px', color: '#6b7280'}}>AI-powered document processing</p>
          </div>
        </div>

        {/* Chat Area */}
        <div
          className="chat-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            ...(isDragging && {
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '2px dashed #3b82f6'
            })
          }}
        >
          {isDragging && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                textAlign: 'center',
                padding: '32px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}>
                <div style={{fontSize: '48px', marginBottom: '16px'}}>📁</div>
                <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '8px'}}>Drop files here</h3>
                <p style={{color: '#6b7280'}}>Release to upload invoices</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                <p style={{marginBottom: '8px', whiteSpace: 'pre-line'}}>{message.content}</p>
                <p style={{fontSize: '12px', opacity: '0.7'}}>{message.timestamp}</p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="message bot">
              <div className="message-content" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{display: 'flex', gap: '4px'}}>
                  <div style={{
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: '#6b7280', 
                    borderRadius: '50%',
                    animation: 'bounce 1.4s infinite ease-in-out'
                  }}></div>
                  <div style={{
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: '#6b7280', 
                    borderRadius: '50%',
                    animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                  }}></div>
                  <div style={{
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: '#6b7280', 
                    borderRadius: '50%',
                    animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                  }}></div>
                </div>
                <span>Processing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <button 
              className="btn upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              📁 Upload
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              style={{display: 'none'}}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <input
              type="text"
              className="input-field"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about invoices or upload files..."
              disabled={isProcessing}
            />
            <button 
              className="btn btn-primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing}
            >
              Send
            </button>
          </div>
          <p style={{fontSize: '12px', color: '#6b7280', textAlign: 'center', marginTop: '8px'}}>
            Upload files using the button or drag & drop • Supports PDF, JPG, PNG
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default App;
