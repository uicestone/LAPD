var app = new Vue({
	el: '#app',
	data: {
		messages: [],
		newMessageText: null,
		token: null,
		location: null
	},
	created: function () {
		var v = this;
		navigator.geolocation.getCurrentPosition(function(result){
			v.location = `${result.coords.longitude.toFixed(6)},${result.coords.latitude.toFixed(6)}`;
		});
	},
	methods: {
		sendMessage: function (e) {
			e.preventDefault();
			this.messages.push({fromClient: true, text: this.newMessageText});
			var v = this;
			setTimeout(function () {
				var content = v.$el.querySelector(".content");
				content.scrollTop = content.scrollHeight;
			});
			this.$http.post('/api/qa/query', {
				text: this.newMessageText,
				location: this.location
			}).then(function (data) {
				this.messages.push({text: data.body.text});
				setTimeout(function () {
					var content = v.$el.querySelector(".content");
					content.scrollTop = content.scrollHeight;
				});
			});
			this.newMessageText = null;
		}
	}
});
