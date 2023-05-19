"use strict";

// const { DynamoDB } = require("aws-sdk");
import { DynamoDB } from "aws-sdk";
import { APIGatewayEvent, Context, APIGatewayProxyCallback } from "aws-lambda";

const documentClient = new DynamoDB.DocumentClient({
  region: "us-east-1",
  maxRetries: 3,
  httpOptions: {
    timeout: 5000, // 5000 milliseconds
  },
});
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
};

// export used for javascript
// module.exports.createNote = async (event, context, cb) => {
// export used for typescript
export const createNote = async (
  event: APIGatewayEvent,
  context: Context,
  cb: APIGatewayProxyCallback
) => {
  context.callbackWaitsForEmptyEventLoop = false; // with this now the handler will return the response as soon as cb(callback function) is called and will not wait until all the callback event queue is empty(which is normal behaviour of node.js). This will improve response time

  // let data = JSON.parse(event.body); // for plain Js
  let data = JSON.parse(event.body as string);
  // or
  // let data = JSON.parse(event.body!);

  try {
    const params = {
      TableName: NOTES_TABLE_NAME as string,
      Item: {
        notesId: data.id, // notesId is primarykey for our notes dynamoDB table. And we are setting its value to the id that we get from data
        title: data.title,
        body: data.body,
      },
      ConditionalExpression: "attribute_not_exists(notesId)", // only creates a new note if the noteId that is passed doesn't exist in the table. If id is already in db then it will not throw any error though just replaces the attributes that are not id. So if we pass id, titile, and subject then it will update the content of title and subject
    };
    await documentClient.put(params).promise();
    cb(null, {
      statusCode: 201,
      body: JSON.stringify(data),
    });
  } catch (err) {
    cb(null, {
      statusCode: 500,
      body: JSON.stringify(err.message),
    });
  }
};

module.exports.updateNote = async (
  event: APIGatewayEvent,
  context: Context,
  cb: APIGatewayProxyCallback
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters?.id;
  let data = JSON.parse(event.body as string);
  try {
    const params = {
      TableName: NOTES_TABLE_NAME as string,
      Key: { notesId },
      UpdateExpression: "set #title = :title, #body = :body", // # and : symbol are for placeholder. like saying notesId(db's id name)=data.id(id obtained from request body)
      ExpressionAttributeNames: {
        // db columns(attributes in NoSQL) name
        "#title": "title",
        "#body": "body",
      },
      ExpressionAttributeValues: {
        ":title": data.title,
        ":body": data.body,
      },
      ConditionExpression: "attribute_exists(notesId)", // only update if the provided id exists in db
    };
    await documentClient.update(params).promise();
    cb(null, send(200, data));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};

module.exports.deleteNote = async (
  event: APIGatewayEvent,
  context: Context,
  cb: APIGatewayProxyCallback
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters?.id;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME as string,
      Key: { notesId },
      ConditionExpression: "attribute_exists(notesId)",
    };
    await documentClient.delete(params).promise();
    cb(null, send(200, notesId));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};

module.exports.getAllNotes = async (
  event: APIGatewayEvent,
  context: Context,
  cb: APIGatewayProxyCallback
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME as string,
    };
    const notes = await documentClient.scan(params).promise();
    cb(null, send(200, notes));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};
