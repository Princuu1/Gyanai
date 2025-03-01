document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const newChatBtn = document.getElementById('new-chat-btn');
  const typingIndicator = document.getElementById('typing-indicator');
  const chatList = document.getElementById('chat-list');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const closeSidebar = document.getElementById('close-sidebar');
  
  let currentChatId = null;
  let isTypingAnimation = false;

  // Initialize
  loadChatHistory();
  checkActiveChat();

  // Event Listeners
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', handleKeyPress);
  newChatBtn.addEventListener('click', startNewChat);
  menuToggle.addEventListener('click', toggleSidebar);
  closeSidebar.addEventListener('click', toggleSidebar);
  window.addEventListener('click', closeSidebarOutside);

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    if (!currentChatId) {
      startNewChat();
    }

    saveMessageToChat({
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    });

    addMessage(message, 'user');
    userInput.value = '';
    showTypingIndicator(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      const aiResponse = data.response || 'Unable to process your request';
      
      saveMessageToChat({
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      });

      typewriterEffect(aiResponse);
    } catch (error) {
      addMessage('Error connecting to the server', 'ai');
    } finally {
      showTypingIndicator(false);
    }
  }

  function typewriterEffect(text) {
    isTypingAnimation = true;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    chatBox.appendChild(messageDiv);
    
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < text.length) {
        messageDiv.textContent += text.charAt(index);
        index++;
        chatBox.scrollTop = chatBox.scrollHeight;
      } else {
        clearInterval(typingInterval);
        isTypingAnimation = false;
      }
    }, 30);
  }

  function addMessage(content, sender) {
    if (sender === 'ai' && isTypingAnimation) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = content;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function startNewChat() {
    currentChatId = `chat-${Date.now()}`;
    chatBox.innerHTML = '';
    saveChatToHistory();
    updateActiveChat();
    toggleSidebar();
  }

  function checkActiveChat() {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    if (chats.length > 0) {
      currentChatId = chats[0].id;
      loadChat(currentChatId);
    }
  }

  function loadChatHistory() {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    chatList.innerHTML = '';
    
    chats.forEach(chat => {
      const li = document.createElement('li');
      li.className = 'chat-item';
      li.dataset.chatId = chat.id;
      li.innerHTML = `
        <span>${chat.title}</span>
        <time>${new Date(parseInt(chat.id.split('-')[1])).toLocaleDateString()}</time>
        <i class="fas fa-trash-alt trash-icon" data-chat-id="${chat.id}"></i>
      `;
      
      li.addEventListener('click', () => loadChat(chat.id));
      li.querySelector('.trash-icon').addEventListener('click', deleteChat);
      chatList.appendChild(li);
    });
    
    updateActiveChat();
  }

  function loadChat(chatId) {
    currentChatId = chatId;
    const chat = getChatFromStorage(chatId);
    chatBox.innerHTML = '';
    
    if (chat?.messages) {
      chat.messages.forEach(msg => {
        addMessage(msg.content, msg.sender);
      });
    }
    
    updateActiveChat();
    toggleSidebar();
  }

  function deleteChat(event) {
    event.stopPropagation();
    const chatId = event.target.dataset.chatId;
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    const filteredChats = chats.filter(chat => chat.id !== chatId);
    
    localStorage.setItem('chats', JSON.stringify(filteredChats));
    loadChatHistory();
    
    if (chatId === currentChatId) {
      startNewChat();
    }
  }

  function saveMessageToChat(message) {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
    
    if (chatIndex > -1) {
      chats[chatIndex].messages.push(message);
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }

  function saveChatToHistory() {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    const existingChat = chats.find(chat => chat.id === currentChatId);
    
    if (!existingChat) {
      chats.unshift({
        id: currentChatId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
        messages: []
      });
      
      localStorage.setItem('chats', JSON.stringify(chats));
      loadChatHistory();
    }
  }

  function toggleSidebar() {
    sidebar.classList.toggle('active');
  }

  function closeSidebarOutside(event) {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(event.target) && 
        !menuToggle.contains(event.target)) {
      sidebar.classList.remove('active');
    }
  }

  function updateActiveChat() {
    document.querySelectorAll('.chat-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.chatId === currentChatId) {
        item.classList.add('active');
      }
    });
  }

  function showTypingIndicator(show) {
    typingIndicator.style.display = show ? 'flex' : 'none';
    if (show) chatBox.scrollTop = chatBox.scrollHeight;
  }
 // Initialize with sidebar closed
 sidebar.classList.remove('active');

 // Toggle sidebar function
 function toggleSidebar() {
   sidebar.classList.toggle('active');
   
   // Handle desktop outside click
   if (window.innerWidth > 768) {
     if (sidebar.classList.contains('active')) {
       document.addEventListener('click', closeSidebarOutside);
     } else {
       document.removeEventListener('click', closeSidebarOutside);
     }
   }
 }



 // Close sidebar when clicking outside (mobile)
 function handleMobileClickOutside(event) {
   if (window.innerWidth <= 768 &&
       sidebar.classList.contains('active') &&
       !sidebar.contains(event.target) &&
       !menuToggle.contains(event.target)) {
     sidebar.classList.remove('active');
   }
 }

 // Update event listeners
 window.addEventListener('click', handleMobileClickOutside);
 
 // ... rest of your existing JavaScript code ...
 
 // Update loadChat and startNewChat to close sidebar
 function loadChat(chatId) {
   currentChatId = chatId;
   const chat = getChatFromStorage(chatId);
   chatBox.innerHTML = '';
   
   if (chat?.messages) {
     chat.messages.forEach(msg => {
       addMessage(msg.content, msg.sender);
     });
   }
   
   updateActiveChat();
   if (window.innerWidth <= 768) {
     toggleSidebar();
   }
 }

 function startNewChat() {
   currentChatId = `chat-${Date.now()}`;
   chatBox.innerHTML = '';
   saveChatToHistory();
   updateActiveChat();
   if (window.innerWidth <= 768) {
     toggleSidebar();
   }
 }
});
  function getChatFromStorage(chatId) {
    return JSON.parse(localStorage.getItem('chats'))
      ?.find(chat => chat.id === chatId);
  }

