var restify = require('restify');
var builder = require('botbuilder');
//var Promise = require('bluebird');
//var url = require('url');
var mysql = require('mysql');
var aCard = require('adaptivecards');





//Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3979, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
//My SQL connectivity
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Pinky12345",
    database: "Bot_DB"
});
// Listen for messages from users 
server.post('/api/messages', connector.listen());
//Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
//var inMemoryStorage = new builder.MemoryBotStorage();

// This bot enables users to either make a dinner reservation or order dinner.
var inMemoryStorage = new builder.MemoryBotStorage();

// This bot enables users to either make a dinner reservation or order dinner.
var bot = new builder.UniversalBot(connector, function (session) {
    session.sendTyping();
    var msg = "Welcome to the ELT BOT, Please select service option to proceed further.";
    session.send(msg);
    ELT_MENU(session);
}).set('storage', inMemoryStorage);

// This dialog helps the user make a dinner reservation.
bot.dialog('Liscense Usage', [
    function (session) {
        session.send("Welcome to the dinner reservation.");
        session.beginDialog('askForDateTime');
    },
    function (session, results) {
        session.dialogData.reservationDate = builder.EntityRecognizer.resolveTime([results.response]);
        session.beginDialog('askForPartySize');
    },
    function (session, results) {
        session.dialogData.partySize = results.response;
        session.beginDialog('askForReserverName');
    },
    function (session, results) {
        session.dialogData.reservationName = results.response;

        // Process request and display reservation details
        session.send(`Reservation confirmed. Reservation details: <br/>Date/Time: ${session.dialogData.reservationDate} <br/>Party size: ${session.dialogData.partySize} <br/>Reservation name: ${session.dialogData.reservationName}`);
        session.endDialog();
    }
])
    .triggerAction({
        matches: /^Liscense Usage$/i,
        confirmPrompt: "This will cancel your current request. Are you sure?"
    });


bot.dialog('Liscense Expiary', [
    function (session) {
        session.send("Below are the list of License with expiary date");
        var sql = "select application_Name from application_expiry";
        console.log("reached here");
        con.query(sql, function (err, result) {
            if (err) throw err;
            //for (var i = 0; i < result.length; i++)
            // session.send(result[i].application_Name)
            var liscense = result[0].application_Name;
            //var attachments = [];
            //var msg = new builder.Message(session);
            //msg.attachmentLayout(builder.Prompt.choice);
            for (var i = 0; i < result.length; i++) {
                //var card = new builder.HeroCard(session)
                //    .title(result[i].application_Name)

                //  attachments.push(card);
              //  var data = new aCard.AdaptiveCard(session)
              //  .addAttachment[]
                var card = {
                    'contentType': 'application/vnd.microsoft.card.adaptive',
                    'content': {
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "type": "AdaptiveCard",
                        "version": "1.0",
                        "body": [
                            {
                                "type": "TextBlock",
                                "text": "What color do you want? (compact)"
                            },
                            {
                                "type": "Input.ChoiceSet",
                                "id": "CompactSelectVal",
                                "style": "compact",
                                "value": "1",
                                "choices": [
                                    {

                                        "title": result[i].application_Name,
                                        "value": result[i].application_Name
                                    }
                                ]
                            }
                        ]
                    }
                };

            }
        

            var msg = new builder.Message(session)
                .addAttachment(card);
            session.send(msg);
            //msg.attachments(attachments);
            //session.send(msg);
            //builder.Prompts.text(session, "Please type Liscense name from above list");
            // Application_Denial(session);
        })
    },
    function (session, results) {
        if (results.response) {
            //var order = dinnerMenu[results.response.entity];
            //var msg = `You ordered: ${order.Description} for a total of $${order.Price}.`;
            //session.dialogData.order = order;
            var Liscense = results.response
            var sql = "select Expiry_Date from application_expiry where application_Name =?";
            console.log("reached here");
            con.query(sql, [Liscense], function (err, result) {
                if (err) throw err;
                //for (var i = 0; i < result.length; i++)
                // session.send(result[i].application_Name)
                var Expiary_DAte = result[0].Expiry_Date;
                session.send('Liscense Expiary Date for ' + Liscense + ' is :' + Expiary_DAte);
                builder.Prompts.text(session, "Please type Liscense Expiary for the List of Liscense  or MENU for main menu");
                // Application_Denial(session);
            })
        }


    }

])
    .triggerAction({
        matches: /^Liscense Expiary$/i,
    });



bot.dialog('help', function (session, args, next) {
    session.endDialog("This is a bot that can help you make a dinner reservation. <br/>Please say 'next' to continue");
})
    .triggerAction({
        matches: /^help$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the dialog stack 
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    });


function ELT_MENU(session) {


    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .buttons([
                builder.CardAction.imBack(session, "Liscense Usage", "Liscense Usage")
            ]),
        new builder.HeroCard(session)
            .buttons([
                builder.CardAction.imBack(session, "Liscense Expiary", "Liscense Expiary")
            ])

    ]);

    session.send(msg);
}

bot.dialog('MENU', function (session, args, next) {
    ELT_MENU(session);
})
    .triggerAction({
        matches: /^MENU$/i,
    });

