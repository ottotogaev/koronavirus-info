const Telegraf = require("telegraf");
const session = require("telegraf/session");
const TelegrafInlineMenu = require("telegraf-inline-menu");
const fs = require("fs");
const api = require("covid19-api");
const COUNTRIES_LIST = require("./HelpCountries");
const Markup = require("telegraf/markup");
const epsilon = require("epsilonjs");

const firebase = require("firebase");

const app = firebase.initializeApp({
  apiKey: "AIzaSyAphdjlrzfCM3N2-zyH3zrDLunn32GmG1s",
  authDomain: "bottelegram-444f4.firebaseapp.com",
  databaseURL: "https://bottelegram-444f4.firebaseio.com",
  projectId: "bottelegram-444f4",
  storageBucket: "bottelegram-444f4.appspot.com",
  messagingSenderId: "250005157546",
  appId: "1:250005157546:web:4ec0b66d4637ada94b42d3",
  measurementId: "G-1YNK4B2LH8",
});

const ref = firebase.database().ref();
const sitesRef = ref.child("users");
const menu = new TelegrafInlineMenu("Tilni tanglang. Выберите язык");

menu.manual("UZ", "uz", {
  root: true,
});

menu.manual("RU", "ru", {
  joinLastRow: true,
  root: true,
});

menu.setCommand("lang");
const bot = new Telegraf("1240252826:AAFLyWWWUP4IU7so4i-kezehklEoqtQP34Y");

bot.use(session());

async function startup() {
  await bot.launch();
  console.log(new Date(), "Bot started as", bot.options.username);
}

bot.use(
  menu.init({
    backButtonText: "Ortga",
    mainMenuButtonText: "Asosiy menyuga",
  })
);

bot.start((ctx) => {
  if (ctx.session.lang != 1 && ctx.session.lang != 0) {
    const testMenu = Telegraf.Extra.markdown().markup((m) =>
      m.inlineKeyboard([
        m.callbackButton("UZ", "uz"),
        m.callbackButton("RU", "ru"),
      ])
    );
    ctx.reply("Tilni tanglang. Выберите язык", testMenu);
  } else {
    if (ctx.session.lang == 0) {
      ctx.reply(
        `Ассалам Алайкум ${ctx.chat.first_name}!
        Статистика коронавируса - Введите название страны на английском языке и получите статистику.
        Вы можете увидеть полный список стран с помощью команд /help.
`,
        Markup.keyboard([
          ["Uzbekistan", "Russia"],
          ["US", "China"],
          [`Выберите язык`],
        ])
          .resize()
          .extra()
      );
    } else if (ctx.session.lang == 1) {
      ctx.reply(
        `Ассалом Алайкум ${ctx.chat.first_name}!
Коронавирус статистикасини - инглиз тилида мамлакат номини киритинг ва статистикани олинг.

/help буйруғи билан мамлакатларнинг тўлиқ рўйхатини куришингиз мумкин.
`,
        Markup.keyboard([
          ["Uzbekistan", "Russia"],
          ["US", "China"],
          [`Tilni tanlash`],
        ])
          .resize()
          .extra()
      );
    }
  }
});

bot.help((ctx) => ctx.reply(COUNTRIES_LIST));

bot.on("text", async (ctx) => {
  if (
    ctx.message.text == "Tilni tanlash" ||
    (ctx.message.text == "Выберите язык" && ctx.message.text !== "/help")
  ) {
    const testMenu = Telegraf.Extra.markdown().markup((m) =>
      m.inlineKeyboard([
        m.callbackButton("UZ", "uz"),
        m.callbackButton("RU", "ru"),
      ])
    );
    ctx.reply("Tilni tanglang. Выберите язык", testMenu);
  } else {
    let data = {};

    try {
      data = await api.getReportsByCountries(ctx.message.text);
      if (ctx.session.lang == 1) {
        const formatData = `
  Давлат : ${data[0][0].country}
  ⚡️Умумий зарарланганлар сони ➖ ${data[0][0].cases}
  ⚡️Соғайганлар ➖ ${data[0][0].recovered}
  ⚡️Вафот этганлар ➖ ${data[0][0].deaths}

  Исталган давлат статистикасини олиш учун - номини инглиз тилида ёзилишини киритинг!
  `;
        ctx.reply(formatData);
      } else if (ctx.session.lang == 0) {
        const formatData = `

        Страна : ${data[0][0].country}
        ⚡️Общее количество зараженных ➖ ${data[0][0].cases}
        ⚡️Выздоровевших ➖ ${data[0][0].recovered}
        ⚡️Погибших ➖ ${data[0][0].deaths}
        Чтобы получить статистику желаемого страны - введите название на английском языке!
  `;
        ctx.reply(formatData);
      }
    } catch (err) {
      console.log(err);
      console.log(data);
      ctx.reply(
        "Сиз киритмоқчи булган давлат номи аниқланмади. Илтимос /help га мурожаат қилинг."
      );
      // ctx.reply(dataActiveCases[0][0].cases);
      // ⚡️Хозирда даволанаётган беморлар ➖ ${data[0][0].active_cases[0].currently_infected_patients}
    }
  }
});

bot.use((ctx, next) => {
  if (ctx.callbackQuery) {
    if (ctx.callbackQuery.data == "ru") {
      if (ctx.session.lang == 1 || ctx.session.lang == 0) {
        ctx.deleteMessage();
        ctx.session.lang = 0;
        ctx.reply(
          "Language changed",
          Markup.keyboard([
            ["Uzbekistan", "Russia"],
            ["US", "China"],
            [`Выберите язык`],
          ])
            .resize()
            .extra()
        );
      } else {
        ctx.deleteMessage();
        sitesRef.push().set({
          user_id: ctx.chat.id,
          first_name: ctx.chat.first_name,
          last_name: ctx.chat.last_name,
        });
        ctx.session.lang = 0;
        ctx.reply(
          `Ассалам Алайкум ${ctx.chat.first_name}!
    Статистика коронавируса - Введите название страны на английском языке и получите статистику.

    Вы можете увидеть полный список стран с помощью команд / help.
`,
          Markup.keyboard([
            ["Uzbekistan", "Russia"],
            ["US", "China"],
            [`Выберите язык`],
          ])
            .resize()
            .extra()
        );
      }
    } else if (ctx.callbackQuery.data == "uz") {
      if (ctx.session.lang == 1 || ctx.session.lang == 0) {
        ctx.deleteMessage();
        ctx.session.lang = 1;
        ctx.reply(
          "Til o'zgardi",
          Markup.keyboard([
            ["Uzbekistan", "Russia"],
            ["US", "China"],
            [`Tilni tanlash`],
          ])
            .resize()
            .extra()
        );
      } else {
        ctx.deleteMessage();
        sitesRef.push().set({
          user_id: ctx.chat.id,
          first_name: ctx.chat.first_name,
          last_name: ctx.chat.last_name,
        });
        ctx.session.lang = 1;
        ctx.reply(
          `Ассалом Алайкум ${ctx.chat.first_name}!
Коронавирус статистикасини - инглиз тилида мамлакат номини киритинг ва статистикани олинг.

/help буйруғи билан мамлакатларнинг тўлиқ рўйхатини куришингиз мумкин.
`,
          Markup.keyboard([
            ["Uzbekistan", "Russia"],
            ["US", "China"],
            ["Tilni tanlash"],
          ])
            .resize()
            .extra()
        );
      }
    }

    console.log(
      "another callbackQuery happened",
      ctx.callbackQuery.data.length,
      ctx.callbackQuery.data,
      ctx.session.lang
    );
  }

  return next();
});

startup();

// Страна : ${data[0][0].country}
//   ⚡️Общее количество зараженных ➖ ${data[0][0].cases}
//   ⚡️Выздоровевших ➖ ${data[0][0].recovered}
//   ⚡️Погибших ➖ ${data[0][0].deaths}
// Чтобы получить статистику желаемого страны - введите название на английском языке!

