/**
 * Created by sungwoo on 14. 4. 11.
 */

/// <reference path="def/node.d.ts" />

var xmpp = require('node-xmpp');
var argv = process.argv;
import common = require('./src/common');

/*
 if (argv.length < 6) {
 console.error('Usage: node send_message.js <my-jid> <my-password> <my-text> <jid> [jid2] ... [jidN]');
 process.exit();
 }
 */

var userName = process.env['USER'];

var cl = new xmpp.Client({
    jid: 'humax-oz@jabber.iitsp.com/glinda/' + userName,
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
        console.log(stanza);
        var command = stanza.getChild('body').getText();
        console.log(command);
        common.runCmd(command, null, (result) => {
            var resp = new xmpp.Element(
                'message',
                { to: stanza.attrs.from, type: 'chat' }
            ).c('body').t(JSON.stringify(result));
            cl.send(resp);
        });
    }
});

cl.addListener('error', function(e) {
    console.error(e);
    process.exit(1);
});

//sudo apt-get install prosody