/**
 * Created by sungwoo on 14. 4. 11.
 */

/// <reference path="def/node.d.ts" />

var xmpp = require('node-xmpp');
var argv = process.argv;

/*
 if (argv.length < 6) {
 console.error('Usage: node send_message.js <my-jid> <my-password> <my-text> <jid> [jid2] ... [jidN]');
 process.exit();
 }
 */

var cl = new xmpp.Client({
    jid: 'humax-oz@jabber.iitsp.com/glinda',
    password: 'gbaortmdhwm'
});

cl.addListener('online', function() {
    console.log('user is online...');
    cl.send(new xmpp.Element('presence', { })
        .c('show').t('chat').up()
        .c('status').t('Happily echoing your <message/> stanzas')
    );
    /*
    var to = 'sejoonlim@openfire';
    console.log('send message to ' + to);
    cl.send(new xmpp.Element('message', {to: to, type: 'chat'}).c('body').t('This is notification message.'));

    // nodejs has nothing left to do and will exit
    cl.end();
    */
});

cl.on('stanza', function(stanza) {
    console.log('Incoming stanza: ', stanza.toString());

    if (stanza.is('message') &&
        // Important: never reply to errors!
        (stanza.attrs.type !== 'error')) {
        // Swap addresses...
        stanza.attrs.to = stanza.attrs.from
        delete stanza.attrs.from
        // and send back
        console.log('Sending response: ' + stanza.root().toString())
        cl.send(stanza)
    }
});

cl.addListener('error', function(e) {
    console.error(e);
    process.exit(1);
});

//sudo apt-get install prosody