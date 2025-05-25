document.addEventListener("DOMContentLoaded", () => {
  const snippetsDiv = document.getElementById("snippets");
  const deleteAllButton = document.getElementById("deleteAll");

  // Настройки
  const settingsIcon = document.getElementById("settingsIcon");
  const settingsModal = document.getElementById("settingsModal");
  const saveSettingsBtn = document.getElementById("saveSettings");
  const closeSettingsBtn = document.getElementById("closeSettings");

  // Показать окно настроек
  settingsIcon.addEventListener("click", () => {
    settingsModal.style.display = "block";
  });

  // Закрыть окно настроек
  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "none";
  });

  // Сохранить настройки
  saveSettingsBtn.addEventListener("click", () => {
    const autosave = document.getElementById("autosaveToggle").checked;
    const format = document.getElementById("formatSelect").value;
    const linkType = document.getElementById("linkTypeSelect").value;

    const defaultLinkText = document.getElementById("defaultLinkText").value;


// обнова
    const settings = { autosave, format, linkType, defaultLinkText }; 

    chrome.storage.local.set({ settings }, () => {
      alert("Настройки сохранены");
      settingsModal.style.display = "none";
    });
  });

  // Загрузка сохранённых настроек
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings || {};
    document.getElementById("autosaveToggle").checked = settings.autosave || false;
    document.getElementById("formatSelect").value = settings.format || "md";
    document.getElementById("linkTypeSelect").value = settings.linkType || "double-bracket";
    document.getElementById("defaultLinkText").value = settings.defaultLinkText || "";

  });

  // Загрузка вырезок
  chrome.storage.local.get({ snippets: [] }, (result) => {
    const snippets = result.snippets;
    if (snippets.length === 0) {
      snippetsDiv.innerHTML = "<div class='no-snippets'><img src='obrez.png' class='no-snippets-image'><p>Нет сохранённых вырезок</p></div>";
      deleteAllButton.style.display = 'none';
    } else {
      deleteAllButton.style.display = 'block';

      snippets.forEach((snippet, index) => {
        const snippetElement = document.createElement("div");
        snippetElement.classList.add("snippet-block");
        const shortenedUrl = snippet.url.length > 50 ? snippet.url.substring(0, 50) + '...' : snippet.url;

        snippetElement.innerHTML = `<p><strong>Текст:</strong> ${snippet.text}</p>
                                    <p><strong>Источник:</strong> <a href="${snippet.url}" target="_blank">${shortenedUrl}</a></p>
                                    <p><strong>Дата:</strong> ${snippet.date}</p>
                                    <div class="button-container">
                                      <button class="saveSnippet" data-index="${index}">Сохранить файл</button>
                                      <button class="editSnippet" data-index="${index}">Редактор</button>
                                      <button class="deleteSnippet" data-index="${index}">Удалить</button>
                                    </div>`;
        snippetsDiv.appendChild(snippetElement);
      });

      // Редактирование
      document.querySelectorAll('.editSnippet').forEach(button => {
        button.addEventListener('click', (event) => {
          const index = event.target.getAttribute('data-index');
          const snippet = snippets[index];
          const largeText = window.open('', '', 'width=600,height=400');
          largeText.document.write(`
            <html><head><title>Редактировать</title>
            <link rel="stylesheet" href="style.css">
            </head><body class="edit-container">
            <textarea id="editText">${snippet.text}</textarea>
            <br><br>
            <button id="saveEdit">Сохранить</button>
            <button id="cancelEdit">Отмена</button>
            </body></html>
          `);
          largeText.onload = function () {
            largeText.document.getElementById("saveEdit").addEventListener("click", () => {
              const updated = largeText.document.getElementById('editText').value;
              if (updated.trim()) {
                snippets[index].text = updated;
                chrome.storage.local.set({ snippets }, () => location.reload());
                largeText.close();
              } else {
                alert('Текст не может быть пустым.');
              }
            });
            largeText.document.getElementById("cancelEdit").addEventListener("click", () => largeText.close());
          };
        });
      });

      // Удаление
      document.querySelectorAll('.deleteSnippet').forEach(button => {
        button.addEventListener('click', (event) => {
          const index = event.target.getAttribute('data-index');
          snippets.splice(index, 1);
          chrome.storage.local.set({ snippets }, () => location.reload());
        });
      });

      // Сохранение с учётом настроек
      document.querySelectorAll('.saveSnippet').forEach(button => {
        button.addEventListener('click', (event) => {
          const index = event.target.getAttribute('data-index');
          chrome.storage.local.get("settings", (data) => {
            const settings = data.settings || {};
            const snippet = snippets[index];

            let relatedNote = "";
            if (!settings.autosave) {
              relatedNote = settings.defaultLinkText?.trim() || "";
              } else {
                relatedNote = prompt("Введите название связанной заметки (если есть):") || "";
              }
            

            // Связь
            let linkLine = "";
            if (relatedNote.trim()) {
              if (settings.linkType === "hashtag") {
                linkLine = `\n\n#${relatedNote}`;
              } else if (settings.linkType === "uri") {
                linkLine = `\n\nСвязь: <${relatedNote}>`;
              } else {
                linkLine = `\n\nСмотрите также: [[${relatedNote}]]`;
              }
            }

           // Генерация читаемого URI на основе первых 3–4 слов заметки
            const rawTitle = (snippet.text || "").split(" ").slice(0, 4).join("_").toLowerCase();
            const titleId = encodeURIComponent(rawTitle || `snippet${index + 1}`);
            const baseUri = `http://cleanbrain.local/note/${titleId}`;

// RDF с отношением rel:relatedTo, если тип связи — URI
            let rdf = `@prefix dc: <http://purl.org/dc/elements/1.1/> .\n@prefix rel: <http://purl.org/vocab/relationship/> .\n\n<${baseUri}>\n  dc:title "${snippet.text}" ;\n  dc:source <${snippet.url}> ;\n  dc:date "${snippet.date}"`;

            if (relatedNote.trim() && settings.linkType === "uri") {
               const relatedUri = `http://cleanbrain.local/note/${encodeURIComponent(relatedNote)}`;
               rdf += ` ;\n  rel:relatedTo <${relatedUri}>`;
              }

              rdf += ` .`;

// Markdown и текстовые форматы
              const plain = `Текст: ${snippet.text}\nИсточник: ${snippet.url}\nДата: ${snippet.date}${linkLine}`;
              const markdown = `# Заметка\n\n**Текст:** ${snippet.text}\n\n**Источник:** [${snippet.url}](${snippet.url})\n\n**Дата:** ${snippet.date}${linkLine}`;

// Определение типа файла
              let content = markdown, mime = "text/markdown", filename = `заметка_${index + 1}.md`;
                if (settings.format === "txt") {
                content = plain;
               mime = "text/plain";
              filename = `заметка_${index + 1}.txt`;
                } else if (settings.format === "rdf") {
                   content = rdf;
                    mime = "text/turtle";
                    filename = `заметка_${index + 1}.ttl`;
                    }


            // Скачивание
            const blob = new Blob([content], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
          });
        });
      });
    }
  });

  // Удалить всё
  deleteAllButton.addEventListener("click", () => {
    chrome.storage.local.clear(() => {
      snippetsDiv.innerHTML = "<div class='no-snippets'><img src='obrez.png' class='no-snippets-image'><p>Нет сохранённых вырезок</p></div>";
      deleteAllButton.style.display = 'none';
    });
  });
});


