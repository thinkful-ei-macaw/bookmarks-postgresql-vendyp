/* eslint-disable quotes */
const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const supertest = global.supertest;

describe.only("Bookmark Endpoints", function () {
  let db;
  const bookmarksTest = [
    {
      id: 1,
      title: "Thinkful",
      url: "www.thinkful.com",
      description: "Think outside the classroom",
      rating: "5",
    },
    {
      id: 2,
      title: "Test 1",
      url: "www.test1.com",
      description: "Test 1 is here.",
      rating: "1",
    },
    {
      id: 3,
      title: "Thinkful",
      url: "www.thinkful.com",
      description: "Think outside the classroom",
      rating: "5",
    },
    {
      id: 4,
      title: "Frog & Toad",
      url: "www.frodandtoad.com",
      description: "They are best friends",
      rating: "5",
    },
  ];
  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () => db("bookmarks").truncate());

  afterEach("cleanup", () => db("bookmarks").truncate());

  context("Given there are bookmarks in the database", () => {
    beforeEach("insert bookmark", () => {
      return db.into("bookmarks").insert(bookmarksTest);
    });

    it("GET /api/bookmarks responds with 200 and all of the bookmarks", () => {
      return supertest(app).get("/api/bookmarks").expect(200, bookmarksTest);
    });
  });
  context(`Given no bookmarks in table `, () => {
    it(`GET responds with a 200 and an empty list`, () => {
      return supertest(app).get("/api/bookmarks").expect(200, []);
    });
  });
  describe(`Get /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmark id`, () => {
      beforeEach("insert bookmark", () => {
        return db.into("bookmarks").insert(bookmarksTest);
      });
      it(`GET responds with 404 not found`, () => {
        const bookmarkId = 7;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(404, "Bookmark Not Found");
      });
      it("GET /api/bookmarks/:bookmark_id responds with 200 and the specified bookmark", () => {
        const bookmarkId = 1;
        const expectedId = bookmarksTest[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(200, expectedId);
      });
    });
    context(`Given an XSS attack article`, () => {
      const maliciousBookmarks = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: "www.google.com",
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 2,
      };

      beforeEach("insert malicious article", () => {
        return db.into("bookmarks").insert([maliciousBookmarks]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmarks.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.title).to.eql(
              'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.description).to.eql(
              `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
            );
          });
      });
    });
  });

  //post
  describe(`POST /api/bookmarks`, () => {
    it(`POST creates a bookmark, responding with 201 and a new bookmark`, function () {
      const newBookmark = {
        id: 7,
        title: "Disneyland",
        url: "www.disney.com",
        description: "Magical kingdom of fun.",
        rating: "3",
      };

      return (
        supertest(app)
          .post("/api/bookmarks")
          .send(newBookmark)
          .expect(201)
          //check to make sure the bookmark is being created
          .expect((res) => {
            expect(res.body).to.have.property("id");
            expect(res.body.title).to.eql(newBookmark.title);
            expect(res.body.url).to.eql(newBookmark.url);
            expect(res.body.description).to.eql(newBookmark.description);
            expect(res.body.rating).to.eql(newBookmark.rating);
          })
          //validating both response bodies:POST and GET match
          .then((postRes) =>
            //implicit return so mocha waits for both request to resolve
            supertest(app)
              .get(`/api/bookmarks/${postRes.body.id}`)
              .expect(postRes.body)
          )
      );
    });
    it(`POST does not create when the required fields are not there`, () => {
      const newBookmark = {};
      return supertest(app)
        .post("/api/bookmarks")
        .send(newBookmark)
        .expect(400, "title, url, description, rating are required.");
    });
  });
  describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
    context(`DELETE given that there are bookmarks in the database`, () => {
      it(`DELETE responds with 404 when the bookmark doesn't exist!`, () => {
        const thirdId = 2;
        return supertest(app)
          .delete(`/api/bookmarks/${thirdId}`)
          .expect(404, "Bookmark does not exist");
      });
    });
  });
  describe.only(`PATCH /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app).patch(`/api/bookmarks/${bookmarkId}`).expect(404);
      });
    });
    context(`Given there are bookmarks in the database`, () => {
      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(bookmarksTest);
      });
      it("responds with 204 and updates the bookmark", (done) => {
        const idToUpdate = 1;
        const updateBookmark = {
          id: 1,
          title: "Knoppers",
          url: "www.amazon.com",
          description: "Knoppers is a tasty wafers snack covered in chocolate.",
          rating: "4",
        };
        supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then(() => {
            //query the database to check if bookmark update is there
            db.select("*")
              .from("bookmarks")
              .where("id", idToUpdate)
              .first()
              .then((results) => {
                console.log(updateBookmark);
                expect(updateBookmark).to.eql(results);
                done();
              })
              .catch((err) => {
                console.error(err);
              });
          });
      });
      it("PATCH responds with a 400 when no values are supplied for any fields(title, url, description, rating", () => {
        const newBookmark = {};
        const idToCheck = 1;
        return supertest(app)
          .patch(`/api/bookmarks/${idToCheck}`)
          .send(newBookmark)
          .expect(400, "title, url, description, rating are required.");
      });
      it("PATCH is able to update when there are only partial updates", () => {
        const idToCheck = 2;
        const newField = {
          title: "Hanuta",
        };
        const expectedBookmark = {
          ...bookmarksTest[idToCheck - 1],
          ...newField,
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToCheck}`)
          .send(newField)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/bookmarks/${idToCheck}`)
              .expect(expectedBookmark)
          );
      });
    });
  });
});
