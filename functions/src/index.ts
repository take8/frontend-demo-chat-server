import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as Koa from "koa";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import * as cors from "@koa/cors";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp(functions.config().firebase);

const app = new Koa();
const router = new Router();

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
  if (ctx.query.auth_token !== undefined) {
    const idToken = ctx.query.auth_token;

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

router.post("/channels", async (ctx: Koa.Context) => {
  const channelName = ctx.body.channelName;
  await createChannel(channelName);
  ctx.type = "application/json; charset=utf-8";
  ctx.status = 201;
  ctx.body = { result: "ok" };
});

router.get("/channels", async (ctx: Koa.Context) => {
  const channelRef = admin.database().ref("channels");
  await channelRef.once("value", snapshot => {
    const items = new Array();
    snapshot.forEach(childSnapshot => {
      const channelName = childSnapshot.key;
      items.push(channelName);
    });
    ctx.type = "application/json; charset=utf-8";
    ctx.body = { channels: items };
  });
});

router.post("/channels/:channelName/messages", (ctx: Koa.Context) => {
  const channelName = ctx.params.channelName;
  const message: MessageInterface = {
    date: new Date().toJSON(),
    body: ctx.body.body,
    user: ctx.user
  };
  const messageRef = admin.database().ref(`channels/${channelName}/messages`);
  messageRef.push(message);
  ctx.type = "application/json; charset=utf-8";
  ctx.status = 201;
  ctx.body = { result: "ok" };
});

router.get("/channels/:channelName/messages", async (ctx: Koa.Context) => {
  const channelName = ctx.params.channelName;
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
    ctx.type = "application/json; charset=utf-8";
    ctx.body = { messages: items };
  });
});

router.post("/reset", async (ctx: Koa.Context) => {
  await createChannel("general");
  await createChannel("random");
  ctx.type = "application/json; charset=utf-8";
  ctx.status = 201;
  ctx.body = { result: "ok" };
});

// router
//   .get("/", (ctx: Koa.Context) => {
//     ctx.body = "Hello, Test";
//   });

// router
//   .post("/", (ctx: Koa.Context) => {
//     console.log(ctx.request.body);
//     ctx.body = "Hello, Test POST";
//   });


// router.get('/', (ctx: Koa.Context) => {
//   ctx.body = "hello world";
//   console.log("success");
// });

// router.post('/', (ctx: Koa.Context) => {
//   console.log(ctx.type);
//   ctx.body = "post hello world";
//   console.log("post success");
//   // console.log(ctx.body);
// });

// router
//   .get('/api', async ctx => {
//     console.log('Getting users from /api');
//     ctx.body = [{ a:1, b:1}, {a:2, b:2}];
//   });

// router
//   .post('/api', async ctx => {
//     console.log('creating user for /api');
//     const user = ctx.request.body;
//     console.log(user);
//     // creation logic goes here
//     // raw input can be accessed from ctx.request.rawBody
//     ctx.status = 201;
//   });


app
  .use(cors({ origin: "*" }))
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

// // x-response-time
 
// app.use(async (ctx, next) => {
//   const start = Date.now(); // --(1)
//   await next();
//   const ms = Date.now() - start;    // --(6)
//   ctx.set('X-Response-Time', `${ms}ms`);    // --(7)
// });
 
// // logger
 
// app.use(async (ctx, next) => {
//   const start = Date.now(); // --(2)
//   await next();
//   const ms = Date.now() - start;    // --(4)
//   console.log(`${ctx.method} ${ctx.url} - ${ms}`);  // --(5)
// });
 
// // response
 
// app.use(async ctx => {
//   ctx.body = 'Hello World'; // --(3)
// });

// app を外部から呼び出せるようにする
const config = {
  port: 5000
};
const server = app.listen(config.port, () => {
  console.log(`HITMers-server is running on port ${config.port}`);
});

module.exports = server;


exports.v1 = functions.https.onRequest(app.callback());
// exports.v1 = functions.https.onRequest(server._events.request);

// app.listen(3000);
// exports.v1 = functions.https.onRequest((request, response) => {
//   // if(request.method !== "POST"){
//   //   response.send(405, 'HTTP Method ' +request.method+' not allowed');
//   // }
//   // response.send(request.body);
//   console.log("-----" + request.body);
//   response.send(request.body);
// });
