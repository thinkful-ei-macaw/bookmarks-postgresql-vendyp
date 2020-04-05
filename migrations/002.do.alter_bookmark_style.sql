CREATE TYPE bookmarks_category AS ENUM (
    'Listicle',
    'How-to',
    'News',
    'Interview',
    'Story'
);

ALTER TABLE bookmarks
  ADD COLUMN
    style bookmarks_category;