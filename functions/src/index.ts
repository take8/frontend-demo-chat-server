import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as Koa from 'koa';
import * as cors from '@koa/cors';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp(functions.config().firebase());

const app = new Koa();
app.use(cors());

interface UserInterface {
  id: string,
  name: string,
  avatar: string
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
