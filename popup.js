// Шаг 5: popup.js
// Этот скрипт отвечает за отображение сохраненных данных в интерфейсе расширения.
document.addEventListener("DOMContentLoaded", () => {
    // Получаем сохраненные фрагменты из локального хранилища
    chrome.storage.local.get({ snippets: [] }, (result) => {
      const snippetsDiv = document.getElementById("snippets");
      result.snippets.forEach((snippet, index) => {
        // блок для каждого сохраненного фрагмента
        const snippetElement = document.createElement("div");
        snippetElement.classList.add("snippet-block");
        snippetElement.innerHTML = `<p><strong>Текст:</strong> ${snippet.text}</p>
                                    <p><strong>Источник:</strong> ${snippet.url}</p>
                                    <p><strong>Дата:</strong> ${snippet.date}</p>
                                    <button class="deleteSnippet" data-index="${index}">Удалить</button>
                                    <button class="saveSnippet" data-index="${index}">Сохранить в файл</button>`;
        snippetsDiv.appendChild(snippetElement);
      });
  // Добавляем обработчики событий для кнопок удаления отдельных фрагментов
      document.querySelectorAll('.deleteSnippet').forEach(button => {
        button.addEventListener('click', (event) => {
          const index = event.target.getAttribute('data-index');
          chrome.storage.local.get({ snippets: [] }, (result) => {
            const snippets = result.snippets;
            snippets.splice(index, 1);// Удаляем фрагмент по индексу
            chrome.storage.local.set({ snippets }, () => {
              location.reload();// Перезагружаем интерфейс для обновления отображения
            });
          });
        });
      });
   // Добавляем обработчики событий для кнопок сохранения фрагментов в файл
      document.querySelectorAll('.saveSnippet').forEach(button => {
        button.addEventListener('click', (event) => {
          const index = event.target.getAttribute('data-index');
          chrome.storage.local.get({ snippets: [] }, (result) => {
            const snippet = result.snippets[index];
            // Создаем текстовый файл с информацией о фрагменте
            const blob = new Blob([`Текст: ${snippet.text}\nИсточник: ${snippet.url}\nДата: ${snippet.date}`], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `snippet_${index + 1}.txt`;
            a.click();
            URL.revokeObjectURL(url);// Освобождаем память, связанную с URL
          });
        });
      });
    });
   // Обработчик для кнопки удаления всех фрагментов
    document.getElementById("deleteAll").addEventListener("click", () => {
      chrome.storage.local.set({ snippets: [] }, () => {
        location.reload();// Перезагружаем интерфейс после удаления всех фрагментов
      });
    });
  });