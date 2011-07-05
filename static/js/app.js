var ImageSet = Backbone.Model.extend({});
var ImageSetStore = Backbone.Collection.extend({
	model: ImageSet,
	url: '/api/imagesets'
});
var imageSets = new ImageSetStore;

var ImageSetView = Backbone.View.extend({

	render: function() {
		var container = $("#imagecontainer").empty();
		
		imageSets.forEach(function(imageSet) {
			var sourceurl = imageSet.get('sourceurl');
			var container = $('<div />', {
				'class': 'imageSet'
			}).hide();
			
			if (sourceurl) container.append($('<div class="imageSetSource"><a href="'+sourceurl+'">'+sourceurl+'</a></div>'));
			
			var imgs = imageSet.get('images') || [];
			imgs.forEach(function (img) {
				console.log(img.url);
				$('<img />', {
					'src': img.url,
					'data-img-ratio': img.ration,
					'width': Math.round(img.width / 2),
					'height': Math.round(img.height / 2)
				}).
				appendTo(container);
			});
			
			$("#imagecontainer").append(container);
		});
		$('.imageSet:last').show();
		
		//var data = messages.map(function(message) { return message.get('content') + '\n'});
		//var result = data.reduce(function(memo,str) { return memo + str }, '');
		//$("#chatHistory").text(result);
		//this.handleEvents();
		return this;
	}

});

var imageSetView = new ImageSetView({el: $('#imagecontainer')});

var reloadSets = function(){
	imageSets.fetch({success: function(){imageSetView.render();}});
};

reloadSets();
//setInterval(reloadSets,30000);


$('#nextset').click( function () {
	var cur = $('.imageSet:visible');
	if (cur.length == 0) {
		$('.imageSet:first').show();
	} else {
		cur.next().show().prevAll().hide();
	}
});
$('#prevset').click( function () {
	var cur = $('.imageSet:visible');
	if (cur.length == 0) {
		$('.imageSet:last').show();
	} else {
		cur.prev().show().nextAll().hide();
	}
});
$('#reload').click(reloadSets);