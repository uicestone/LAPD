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
			
			if (!this.newMessageText) {
				return false;
			}

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
				var message = data.body;
				
				if (message.url) {
					message.url = data.body.url.match(/https:/) ? data.body.url : '/api/proxy?url=' + encodeURIComponent(data.body.url);
				}

				this.messages.push(message);
				setTimeout(function () {
					var content = v.$el.querySelector(".content");
					content.scrollTop = content.scrollHeight - content.querySelector('.kuang:last-child').clientHeight - 50;
				});
			});
			this.newMessageText = null;
		},
		replyQa: function (id) {
			var v = this;
			this.$http.get('/api/qa/' + id).then(function (data) {
				// console.log(data);
				v.messages.push({html: data.body.a});
				setTimeout(function () {
					var content = v.$el.querySelector(".content");
					content.scrollTop = content.scrollHeight - content.querySelector('.kuang:last-child').clientHeight - 50;
				});
			});
		}
	}
});
