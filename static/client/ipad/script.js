
$(document).ready(function() {
	if ( ! navigator.userAgent.match('iPad') )
	{
		alert( 'This InspirationFeedr Demo Client is specially desiged for the Apple iPad, so you'
		+' might want to run it on one.' );
	}
});

$(function(){


var ImageSet = Backbone.Model.extend({
	// add methodes
});

var ImageSetCollection = Backbone.Collection.extend({
	model: ImageSet
});

window.AppView = Backbone.View.extend({
	
	el: $('#appview'),
	
});

window.App = new AppView;

}); // end $(function(){

