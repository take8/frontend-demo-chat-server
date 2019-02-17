import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as cors from '@koa/cors';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp(functions.config().firebase());

const app = new Koa();
const router = new Router();
app.use(cors());

interface UserInterface {
  id: string,
  name: string,
  avatar: string
}

interface MessageInterface {
  date: string,
  body: string,
  user: UserInterface
}

const anonymousUser: UserInterface = {
  id: "anon",
  name: "Anonymous",
  avatar: ""
};

const checkUser = async (ctx: Koa.Context, next: Function) => {
  ctx.user = anonymousUser;
  if (ctx.request.query.auth_token != undefined) {
    const idToken = ctx.request.query.auth_token;

    const decodedIdTaken = await admin.auth().verifyIdToken(idToken)
    .catch(async error => {
      await next();
      throw error;
    });
    const authUser: UserInterface = {
      id: decodedIdTaken.user_id,
      name: decodedIdTaken.name,
      avatar: decodedIdTaken.picture
    };
    ctx.user = authUser;
    await next();
  } else {
    await next();
  }
}

app.use(checkUser);

function createChannel(channelName: string) {
  const channelRef = admin.database().ref("channels");
  const date1 = new Date();
  const date2 = new Date();
  date2.setSeconds(date2.getSeconds() + 1);
  const defaultData = `{
    "messages": {
      "1": {
        "body": "Welcome to #${channelName} channel!",
        "date": "${date1.toJSON()}",
        "user": {
          "avatar": "",
          "id": "robot",
          "name": "Robot"
        }
      },
      "2": {
        "body": "はじめてのメッセージを投稿してみましょう。",
        "date": "${date2.toJSON()}",
        "user": {
          "avatar": "",
          "id": "robot",
          "name": "Robot"
        }
      }
    }
  }`;

  // "/channels/:channelName"
  channelRef.child(channelName).set(JSON.parse(defaultData));
}

router.post("/channels", (ctx: Koa.Context) => {
  const channelName = ctx.request.body.channelName;
  createChannel(channelName);
  ctx.type = "application/json; charset=utf-8";
  ctx.status = 201;
  ctx.json({ result: "ok" });
});

router.get("/channels", (ctx: Koa.Context) => {
  const channelRef = admin.database().ref("channels");
  channelRef.once("value", snapshot => {
    let items = new Array();
    snapshot.forEach(childSnapshot => {
      const channelName = childSnapshot.key;
      items.push(channelName);
    });
    ctx.type = "application/json; charset=utf-8";
    ctx.json({ channels: items });
  });
});

router.post("/channels/:channelName/messages", (ctx: Koa.Context) => {
  const channelName = ctx.params.channelName;
  const message: MessageInterface = {
    date: new Date().toJSON(),
    body: ctx.request.body.body,
    user: ctx.user
  };
  const messageRef = admin.database().ref(`channels/${channelName}/messages`);
  messageRef.push(message);
  ctx.type = "application/json; charset=utf-8";
  ctx.status = 201;
  ctx.json({ result: "ok" });
});

router.get("/channels/:channelName/messages", (ctx: Koa.Context) => {
  const channelName = ctx.params.channelName;
  const messageRef = admin.database().ref(`channels/${channelName}/messages`)
      .orderByChild("date")
      // 最後から20件
      .limitToLast(20);
  messageRef.once("value", snapshot => {
    let items = new Array();
    snapshot.forEach(childSnapshot => {
      const message = childSnapshot.val();
      message.id = childSnapshot.key;
      items.push(message);
    });
    items.reverse();
    ctx.type = "application/json; charset=utf-8";
    ctx.json({ messages: items });
  });
});

router.post("/reset", (ctx: Koa.Context) => {
  createChannel("general");
  createChannel("random");
  ctx.type = "application/json; charset=utf-8";
  ctx.status = 201;
  ctx.json({ result: "ok" });
});

app.use(router.routes());
app.use(router.allowedMethods());

// app を外部から呼び出せるようにする
exports.v1 = functions.https.onRequest(app.callback());
