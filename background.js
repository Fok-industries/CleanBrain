// Шаг 2: background.js
// Этот скрипт обрабатывает действия пользователя, такие как сохранение выделенного текста.
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "saveText",
      title: "Сохранить выделенный текст CleanBrain",
      contexts: ["selection"]
    });
  });
  
 // Обрабатываем нажатие на пункт контекстного меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveText" && info.selectionText) {
      // Создаем объект с информацией о выделенном тексте, URL и текущей дате
      const snippet = {
        text: info.selectionText,
        url: tab.url,
        date: new Date().toLocaleString()
      };
      
      // Получаем существующие сохраненные фрагменты из локального хранилища и добавляем новый
      chrome.storage.local.get({ snippets: [] }, (result) => {
        const snippets = result.snippets;
        snippets.push(snippet);
        chrome.storage.local.set({ snippets }, () => {
          console.log("Текст сохранён!", snippet);
        });
      });
    }
  });