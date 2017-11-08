var app = new Vue({
	el: '#app',
	data: {
		messages: [
			{ fromClient:true, text: '学习 JavaScript' },
			{ text: '学习 Vue' },
			{ fromClient:true, text: '整个牛项目' }
		],
		newMessageText: null
	},
	methods: {
		sendMessage: function (e) {
			this.messages.push({fromClient: true, text: this.newMessageText});
			this.newMessageText = null;
			var that = this;
			setTimeout(function () {
				var content = that.$el.querySelector(".content");
				content.scrollTop = content.scrollHeight;
			});
		}
	}
})