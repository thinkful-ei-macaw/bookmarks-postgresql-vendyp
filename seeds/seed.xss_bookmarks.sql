INSERT INTO bookmarks (id, title, url, description, rating)
VALUES
  (911, 'Injection post!', 'www.google.com',
    'This text contains an intentionally broken image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie); alert(''you just got pretend hacked! oh noes!'');">. The image will try to load, when it fails, <strong>It executes malicious JavaScript</strong>', '4');