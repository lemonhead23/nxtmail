if (Meteor.isServer) {
	  Meteor.methods({
    getShelljs: function getShelljs() {
      var shell = Meteor.npmRequire('shelljs');

		console.log(shell.ls("../../../../../"));
    },
    sendEmail: function (to, from, subject, text) {
		check([to, from, subject, text], [String]);

		// Let other method calls from the same client start running,
		// without waiting for the email sending to complete.
		this.unblock();

		Email.send({
		  to: to,
		  from: from,
		  subject: subject,
		  text: text
		});
  },
   sendEmailEncrypted: function (to, from, subject, text) {
		check([to, from, subject, text], [String]);
		
		var shell = Meteor.npmRequire('shelljs');
		var key = shell.cat('../../../../../pgpkey/'+Meteor.settings.PGPKEY);
		var openpgp = Meteor.npmRequire('openpgp');
		var publicKey = openpgp.key.readArmored(key);

		openpgp.encryptMessage(publicKey.keys, text).then(function(pgpMessage) {
		
		
		Email.send({
		  to: to,
		  from: from,
		  subject: subject,
		  text: pgpMessage
		});
		// success
		}).catch(function(error) {
			// failure
		});


  }
  });
  
 
}
