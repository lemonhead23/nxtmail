Accounts = new Mongo.Collection("accounts");
Info = new Mongo.Collection("info");

if (Meteor.isClient) {

  Meteor.subscribe('accounts');
  Meteor.subscribe('info');
  
  Session.setDefault('startBlock', '0');
  Session.setDefault('latestBlock', '0');
  Session.setDefault('latestScannedBlock', '0');
  
//Meteor.call('sendEmail',
            //'lemonhead@posteo.de',
            //'"lemon" <lemonhead@posteo.de>',
            //'Hello from Meteor!',
            //'This is a test of Email.send.');
    
        //Meteor.call('sendEmailEncrypted',
            //'lemonhead@posteo.de',
            //'"lemon" <lemonhead@posteo.de>',
            //'Hello from Meteor!',
            //'This is a test of Email.send.');
		
  	function scanBlocks(height){
		
		Meteor.call("scanBlocks",height);
	}
	
  function updateLatestBlock(){
	  
	  var query = {requestType : "getBlocks",lastIndex:0};
      Meteor.call("nxtcall",query, 
					function(error, result){
						var content = JSON.parse(result.content);
						console.log(content.blocks[0].height);
						var latestBlockInSession = Session.get('latestBlock');
						if(content.blocks[0].block != latestBlockInSession){
							Session.set('latestBlock', content.blocks[0].block);
						};
					}
				);
	}
	
	updateLatestBlock();
	
	//update latest Block every x milliseconds
	Meteor.setInterval(function (){updateLatestBlock();}, 20000);
	
	

	


  Template.accountoverview.helpers({
    accounts: function () {
		return Accounts.find().fetch();
    }
  });

  Template.blocks.events({
    'click button': function () {

      var blockstart = $('#blockstart').val();
      
      //var query = {requestType : "getBlockId",height:blockstart};
      //Meteor.call("nxtcall",query, 
					//function(error, result){
						//var content = JSON.parse(result.content);
						////console.log(content);
						//return content;
					//}
				//);
		scanBlocks(blockstart);
    }
  });
  
  Template.addaccount.events({
    'click button': function () {

      var accountid = $('#account').val();
      Accounts.insert({'accountid':accountid});
    }
  });
}

if (Meteor.isServer) {
	Meteor.publish('accounts', function() {
	  return Accounts.find();
	});
	Meteor.publish('info', function() {
	  return Info.find();
	});
	
	//MAIL SETTINGS
	process.env.MAIL_URL = Meteor.settings.MAIL_USER+encodeURIComponent(Meteor.settings.MAIL_PASSWORD)+Meteor.settings.MAIL_SERVER;
	

	var server= "http://localhost:7876/nxt?";
	
	var latestScannedBlock = 0;
	
	Meteor.methods({
		nxtcall: function(query){
			
			  //this.unblock();
			  //console.log(query);
			  try {
				var result = HTTP.call("GET", server,
									   {params: query});

				return result;
			  } catch (e) {
				// Got a network error, time-out or HTTP error in the 400 or 500 range.
				return false;
			  }
		},updateLatestBlock: function(){
	  
	  var query = {requestType : "getBlocks",lastIndex:0};
      Meteor.call("nxtcall",query, 
					function(error, result){
						var content = JSON.parse(result.content);
						console.log(content.blocks[0].height);
						//var latestBlockInSession = Session.get('latestBlock');
						if(content.blocks[0].block != latestBlockInSession){
							//Session.set('latestBlock', content.blocks[0].block);
						};
					}
				);
	},
		scanBlocks: function(height){
			
			var latestBlock = 0;
				  var query = {requestType : "getBlocks",lastIndex:0};
				  Meteor.call("nxtcall",query, 
								function(error, result){
									var content = JSON.parse(result.content);
									//console.log(content.blocks[0].height);


									latestBlock = content.blocks[0].height;
								}
							);
			
			  
			  //this.unblock();
			  console.log(latestBlock);
		var heightNotInRange = true;
					
  		var firstIndex = 0;
		var lastIndex = 100;
		var latestScannedBlock = 0;
		
		var accounts = Accounts.find().fetch();
		
		var mailText = "";
		
		//var latestBlock = Session.get('latestBlock');
		
		var difference = (latestBlock - height);
		if(difference%100>0)
			difference+=100;
		console.log(difference);
		
			for(lastIndex;lastIndex<=difference;lastIndex+=100){

				query = {"requestType" : "getBlocks","firstIndex":firstIndex,"lastIndex":lastIndex,includeTransactions:true};
				
				//try {
				//var result = HTTP.call("GET", server,
									   //{params: query});

				//console.log(result.content.blocks[0].height);
			  //} catch (e) {
				//// Got a network error, time-out or HTTP error in the 400 or 500 range.
				//return false;
			  //}
				Meteor.call("nxtcall",query, 
							function(error, result){

								content = JSON.parse(result.content);

								//Session.set("latestScannedBlock", content.blocks[0].height);
								latestScannedBlock = content.blocks[0].height;
								for(i=100;i>=0;i--){
									thisBlock = content.blocks[i].height;

									if(thisBlock>=height){
										transactions = content.blocks[i].transactions;
										transactions.forEach(function(row) {

											accounts.forEach(function(account) {
												if(account.accountid==row.senderRS || account.accountid==row.recipientRS){
													mailText = mailText.concat(JSON.stringify(row, null, 2)+","); 
												}
											});
										});
									}
								
								}

							}
						);
					

				firstIndex = firstIndex+100;

				
				//latestScannedBlock = Session.get('latestScannedBlock');
				console.log(latestScannedBlock);
				if(latestScannedBlock < height){
					//console.log("ttttteeeeeeeeeeeeeeeeeeeeeee");
					heightNotInRange = false;
				}
				
				
			}
			
			Meteor.call('sendEmailEncrypted',
				'lemonhead@posteo.de',
				'"lemon" <lemonhead@posteo.de>',
				'Hello from Meteor!',
				mailText);
			
		},
		
		
	});
	
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
