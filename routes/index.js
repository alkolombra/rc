
/*
 * GET home page.
 */

var fs = require('fs');

exports.index = function(req, res){	
  res.render('layout', { title: 'Express' });
};

exports.views = function(req, res){
	//console.log(req.params.page);
	//console.log(res);
 var file = 'views/partials/'+req.params.view + '.jade';
 //var file = 'views/partials/'+req.params.page + '.jade';
 fs.exists(file, function(exists){
 	//exists ? res.render('partials/'+req.params.page) : res.send(404);
   exists ? res.render('partials/'+req.params.view) : res.send(404);
 });
}

exports.file = function(req, res, next){
	var file = 'views/partials/'+req.params.file + '.jade';

	fs.exists(file, function(exists){
		exists ? res.render('partials/'+req.params.file, {title:req.params.file}) : next();
	});
}