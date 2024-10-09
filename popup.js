document.addEventListener("DOMContentLoaded", () => {
  const snippetsDiv = document.getElementById("snippets");
  const deleteAllButton = document.getElementById("deleteAll");

  chrome.storage.local.get({ snippets: [] }, (result) => {
    if (result.snippets.length === 0) {
      snippetsDiv.innerHTML = "<div class='no-snippets'><img src='obrez.png' class='no-snippets-image'><p>Нет сохранённых вырезок</p></div>";
      deleteAllButton.style.display = 'none';
    } else {
      deleteAllButton.style.display = 'block';
      result.snippets.forEach((snippet, index) => {
        const snippetElement = document.createElement("div");
        snippetElement.classList.add("snippet-block");
        const shortenedUrl = snippet.url.length > 50 ? snippet.url.substring(0, 50) + '...' : snippet.url;
        snippetElement.innerHTML = `<p><strong>Текст:</strong> ${snippet.text}</p>
                                    <p><strong>Источник:</strong> <a href="${snippet.url}" target="_blank">${shortenedUrl}</a></p>
                                    <p><strong>Дата:</strong> ${snippet.date}</p>
                                    <button class="deleteSnippet" data-index="${index}">Удалить</button>
                                    <button class="saveSnippet" data-index="${index}">Сохранить в файл</button>`;
        snippetsDiv.appendChild(snippetElement);
      });
    }

    document.querySelectorAll('.deleteSnippet').forEach(button => {
      button.addEventListener('click', (event) => {
        const index = event.target.getAttribute('data-index');
        chrome.storage.local.get({ snippets: [] }, (result) => {
          const snippets = result.snippets;
          snippets.splice(index, 1);
          chrome.storage.local.set({ snippets }, () => {
            location.reload();
          });
        });
      });
    });

    document.querySelectorAll('.saveSnippet').forEach(button => {
      button.addEventListener('click', (event) => {
        const index = event.target.getAttribute('data-index');
        chrome.storage.local.get({ snippets: [] }, (result) => {
          const snippet = result.snippets[index];
          const blob = new Blob([`Текст: ${snippet.text}\nИсточник: ${snippet.url}\nДата: ${snippet.date}`], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `snippet_${index + 1}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        });
      });
    });
  });

  deleteAllButton.addEventListener("click", () => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error("Ошибка при удалении данных:", chrome.runtime.lastError);
      } else {
        console.log("Все данные успешно удалены!");
        snippetsDiv.innerHTML = "<div class='no-snippets'><img src='obrez.png' class='no-snippets-image'><p>Нет сохранённых вырезок</p></div>";
        deleteAllButton.style.display = 'none';
      }
    });
  });
});
