// Ждём загрузки содержимого документа
document.addEventListener("DOMContentLoaded", () => {
  const snippetsDiv = document.getElementById("snippets"); // Получаем элемент для отображения сохранённых вырезок
  const deleteAllButton = document.getElementById("deleteAll"); // Получаем кнопку "Удалить все"

  // Получаем сохранённые вырезки из локального хранилища
  chrome.storage.local.get({ snippets: [] }, (result) => {
    if (result.snippets.length === 0) {
      // Если вырезок нет, показываем сообщение о том, что нет сохранённых вырезок
      snippetsDiv.innerHTML = "<div class='no-snippets'><img src='obrez.png' class='no-snippets-image'><p>Нет сохранённых вырезок</p></div>";
      deleteAllButton.style.display = 'none'; // Скрываем кнопку "Удалить все", так как вырезок нет
    } else {
      deleteAllButton.style.display = 'block'; // Показываем кнопку "Удалить все", если есть вырезки
      // Отображаем каждую вырезку
      result.snippets.forEach((snippet, index) => {
        const snippetElement = document.createElement("div");
        snippetElement.classList.add("snippet-block"); // Добавляем класс для блока вырезки

        // Укорачиваем URL, если он слишком длинный
        const shortenedUrl = snippet.url.length > 50 ? snippet.url.substring(0, 50) + '...' : snippet.url;

        // Добавляем HTML содержимое для каждой вырезки, включая текст, источник, дату и кнопки
        snippetElement.innerHTML = `<p><strong>Текст:</strong> ${snippet.text}</p>
                                    <p><strong>Источник:</strong> <a href="${snippet.url}" target="_blank">${shortenedUrl}</a></p>
                                    <p><strong>Дата:</strong> ${snippet.date}</p>
                                    <div class="button-container">
                                      <button class="saveSnippet" data-index="${index}">Сохранить файлом</button>
                                      <button class="editSnippet" data-index="${index}">Редактировать</button>
                                      <button class="deleteSnippet" data-index="${index}">Удалить</button>
                                    </div>`;
        snippetsDiv.appendChild(snippetElement); // Добавляем созданный элемент в контейнер с вырезками
      });

      // Добавляем обработчики событий для кнопок "Редактировать"
      document.querySelectorAll('.editSnippet').forEach(button => {
        button.addEventListener('click', (event) => {
          const index = event.target.getAttribute('data-index'); // Получаем индекс вырезки
          chrome.storage.local.get({ snippets: [] }, (result) => {
            const snippets = result.snippets;
            const snippet = snippets[index];

            // Открываем новое окно для редактирования текста
            const largeText = window.open('', '', 'width=600,height=400');
            largeText.document.write(`
              <html>
              <head>
                <title>Редактировать текст</title>
                <link rel="stylesheet" type="text/css" href="style.css">
              </head>
              <body class="edit-container">
                <textarea id="editText">${snippet.text}</textarea>
                <br><br>
                <button id="saveEdit">Сохранить</button>
                <button id="cancelEdit">Отмена</button>
              </body>
              </html>
            `);

            // Обработчик для кнопки "Сохранить" в окне редактирования
            largeText.document.getElementById("saveEdit").addEventListener("click", () => {
              const updatedText = largeText.document.getElementById('editText').value; // Получаем обновлённый текст
              if (updatedText.trim() !== '') {
                snippets[index].text = updatedText; // Обновляем текст в массиве вырезок
                chrome.storage.local.set({ snippets }, () => {
                  location.reload(); // Перезагружаем страницу для отображения обновлённого текста
                });
                largeText.close(); // Закрываем окно редактирования
              } else {
                alert('Текст не может быть пустым.'); // Показываем предупреждение, если текст пустой
              }
            });

            // Обработчик для кнопки "Отмена" в окне редактирования
            largeText.document.getElementById("cancelEdit").addEventListener("click", () => {
              largeText.close(); // Закрываем окно редактирования без сохранения
            });
          });
        });
      });

      // Добавляем обработчики событий для кнопок "Удалить"
      document.querySelectorAll('.deleteSnippet').forEach(button => {
        button.addEventListener('click', (event) => {
          const index = event.target.getAttribute('data-index'); // Получаем индекс вырезки
          chrome.storage.local.get({ snippets: [] }, (result) => {
            const snippets = result.snippets;
            snippets.splice(index, 1); // Удаляем вырезку из массива
            chrome.storage.local.set({ snippets }, () => {
              location.reload(); // Перезагружаем страницу для отображения оставшихся вырезок
            });
          });
        });
      });

      // Добавляем обработчики событий для кнопок "Сохранить в формате Markdown"
      document.querySelectorAll('.saveSnippet').forEach(button => {
        button.addEventListener('click', (event) => {
          const index = event.target.getAttribute('data-index'); // Получаем индекс вырезки
          chrome.storage.local.get({ snippets: [] }, (result) => {
            const snippet = result.snippets[index];

            // Запрашиваем название заметки для связи
           const relatedNote = prompt("Введите название связанной заметки (если есть):");

           // Создаём Markdown контент с возможной ссылкой
          let markdownContent = `# Заметка\n\n**Текст:** ${snippet.text}\n\n**Источник:** [${snippet.url}](${snippet.url})\n\n**Дата:** ${snippet.date}`;
           if (relatedNote) {
            markdownContent += `\n\nСмотрите также: [[${relatedNote}]]`;
           }

      // Сохраняем в файл .md
            
            const blob = new Blob([markdownContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `заметка_${index + 1}.md`; // Имя файла для сохранения
            a.click(); // Запускаем скачивание файла
            URL.revokeObjectURL(url); // Освобождаем URL-ресурс
          });
        });
      });
    }
  });

  // Обработчик для кнопки "Удалить все"
  deleteAllButton.addEventListener("click", () => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error("Ошибка при удалении данных:", chrome.runtime.lastError); // Вывод ошибки, если произошла ошибка удаления
      } else {
        console.log("Все данные успешно удалены!"); // Лог успеха
        // Обновляем содержимое страницы для отображения сообщения, что вырезок нет
        snippetsDiv.innerHTML = "<div class='no-snippets'><img src='obrez.png' class='no-snippets-image'><p>Нет сохранённых вырезок</p></div>";
        deleteAllButton.style.display = 'none'; // Скрываем кнопку "Удалить все"
      }
    });
  });
});
