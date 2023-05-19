"use strict";

let init = require("./steps/init");
let { an_authentcated_user } = require("./steps/given");
let {
  we_invoke_createNote,
  we_invoke_updateNote,
  we_invoke_deleteNote,
} = require("./steps/when");

let idToken;

describe("Given an authenticated user", () => {
  // you cannot use await in describe function
  beforeAll(async () => {
    init();
    let user = await an_authentcated_user();
    idToken = user.AuthenticationResult.IdToken;
  });

  describe("When we invoke POST /notes endpoint", () => {
    it("Should create a new note", async () => {
      const body = {
        id: "1000",
        titile: "My test note",
        body: "Hello this is the note body",
      };
      let result = await we_invoke_createNote({ idToken, body });
      expect(result.statusCode).toEqual(201);
      expect(result.body).not.toBeNull();
    });
  });

  describe("When we invoke PUT /notes/:id endpoint", () => {
    it("Should update the note", async () => {
      const noteId = "1000";
      const body = {
        titile: "My updated test note",
        body: "Hello this is the updated note body",
      };
      let result = await we_invoke_updateNote({ idToken, body, noteId });
      expect(result.statusCode).toEqual(200);
      expect(result.body).not.toBeNull();
    });
  });

  describe("When we invoke DELETE /notes/:id endpoint", () => {
    it("Should delete the note", async () => {
      const noteId = "1000";

      let result = await we_invoke_deleteNote({ idToken, noteId });
      expect(result.statusCode).toEqual(200);
      expect(result.body).not.toBeNull();
    });
  });
});
