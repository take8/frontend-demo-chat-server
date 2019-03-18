import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as Express from "express";
import * as cors from "cors";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp(functions.config().firebase);

const app = Express();
const router = Express.Router();

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

const checkUser = async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
  req.body.user = anonymousUser;
  if (req.query.auth_token !== undefined) {
    const idToken = req.query.auth_token;

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
    // TODO: bodyに格納するやり方でいいのか?
    req.body.user = authUser;
    await next();
  } else {
    await next();
  }
}

app.use(checkUser);

async function createChannel(channelName: string) {
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
  await channelRef.child(channelName).set(JSON.parse(defaultData));
}

router.post("/channels", async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
  const channelName = req.body.channelName;
  await createChannel(channelName);
  res.header("Content-Type", "application/json; charset=utf-8");
  res.status(201).send({ result: "ok" });
});

router.get("/channels", async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
  const channelRef = admin.database().ref("channels");
  await channelRef.once("value", snapshot => {
    const items = new Array();
    snapshot.forEach(childSnapshot => {
      const channelName = childSnapshot.key;
      items.push(channelName);
    });
    res.header("Content-Type", "application/json; charset=utf-8");
    res.send({ channels: items });
  });
});

router.post("/channels/:channelName/messages", (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
  const channelName = req.params.channelName;
  const message: MessageInterface = {
    date: new Date().toJSON(),
    body: req.body.body,
    user: req.body.user
  };
  const messageRef = admin.database().ref(`channels/${channelName}/messages`);
  messageRef.push(message);
  res.header("Content-Type", "application/json; charset=utf-8");
  res.status(201).send({ result: "ok" });
});

router.get("/channels/:channelName/messages", async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
  const channelName = req.params.channelName;
  const messageRef = admin.database().ref(`channels/${channelName}/messages`)
      .orderByChild("date")
      // 最後から20件
      .limitToLast(20);
  await messageRef.once("value", snapshot => {
    const items = new Array();
    snapshot.forEach(childSnapshot => {
      const message = childSnapshot.val();
      message.id = childSnapshot.key;
      items.push(message);
    });
    items.reverse();
    res.header("Content-Type", "application/json; charset=utf-8");
    res.send({ messages: items });
  });
});

router.post("/reset", async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
  await createChannel("general");
  await createChannel("random");
  res.header("Content-Type", "application/json; charset=utf-8");
  res.status(201).send({ result: "ok" });
});


app
  .use(cors({ origin: true }))
  .use("/", router);

exports.v1 = functions.https.onRequest(app);
