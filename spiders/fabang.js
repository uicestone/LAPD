'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const compression = require('compression');
const mongoose    = require('mongoose');
const app         = express();
const router      = express.Router();
const httpServer  = require('http').createServer(app);
const io          = require('socket.io')(httpServer);
const env         = require('node-env-file');
const cors        = require('cors');
const fs          = require('fs');
const http        = require('http');
const { JSDOM }   = require('jsdom');
const jQuery      = require('jquery');
const iconvDecode = require('iconv-lite').decode;
const { Buffer }  = require('buffer');
const Qa          = require ('../server/models/qa.js');

env(`${__dirname}/.env`);

mongoose.connect(process.env.MONGODB_URL, {useMongoClient: true});
mongoose.Promise = global.Promise;

async function httpGet (url) {

	return new Promise((resolve, reject) => {
		
		http.get(url, (res) => {

			const { statusCode } = res;
			const contentType = res.headers['content-type'];

			// res.setEncoding('utf8');
			const chunks = [];
			res.on('data', (chunk) => { chunks.push(chunk); });
			res.on('end', () => {
				
				const rawData = iconvDecode(Buffer.concat(chunks), 'gb2312').toString();
				
				if (statusCode !== 200) {

					if (statusCode === 302) {
						resolve(httpGet(res.headers['location']));
						return;
					}
					
					const e = {status: statusCode, message: `Request Failed (${statusCode}). URL: ${url}`};
					console.error(e.message);
					
					// consume response data to free up memory
					res.resume();

					if (statusCode === 403 && rawData.match(/openresty/)) {
						console.error('IP blocked.');
						process.exit();
					}
					reject(e);
				}

				resolve(rawData);
			});
			
		}).on('error', (e) => {
			reject(e);
		});

	});
};

async function sleep(milliseconds) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, milliseconds);
	});
}

const cats = [{label: "婚姻家庭", uri: "/zhishi/hunyin/"},{label: "劳动纠纷", uri: "/zhishi/laodongjiufen/"},{label: "治安管理处罚法", uri: "/zhishi/zaglcff/"},{label: "公司法", uri: "/zhishi/gongsifa/"},{label: "知识产权", uri: "/zhishi/zhishichanquan/"},{label: "经济仲裁", uri: "/zhishi/jingjizhongcai/"},{label: "国际贸易", uri: "/zhishi/guojimaoyi/"},{label: "遗产继承", uri: "/zhishi/yichanjicheng/"},{label: "交通事故", uri: "/zhishi/jiaotongshigu/"},{label: "财税法律", uri: "/zhishi/caishuifalv/"},{label: "拆迁安置", uri: "/zhishi/chaiqiananzhi/"},{label: "医疗事故", uri: "/zhishi/yiliao/"},{label: "损害赔偿", uri: "/zhishi/sunhaipeichang/"},{label: "债权债务", uri: "/zhishi/zhaiquanzhaiwu/"},{label: "人身损害", uri: "/zhishi/renshensunhai/"},{label: "抵押担保", uri: "/zhishi/diyadanbao/"},{label: "保险理赔", uri: "/zhishi/baoxianlipei/"},{label: "不当竞争", uri: "/zhishi/budangjingzheng/"},{label: "刑事辩护", uri: "/zhishi/xingshibianhu/"},{label: "取保候审", uri: "/zhishi/qubaohoushen/"},{label: "刑事自诉", uri: "/zhishi/xingshizisu/"},{label: "国家赔偿", uri: "/zhishi/guojiapeichang/"},{label: "破产清算", uri: "/zhishi/pochanqingsuan/"},{label: "行政法", uri: "/zhishi/xingzhengfa/"},{label: "工程建筑", uri: "/zhishi/gongchengjianzhu/"},{label: "消费维权", uri: "/zhishi/xiaofeiweiquan/"},{label: "公证法", uri: "/zhishi/gongzhengfa/"},{label: "法律讲堂", uri: "/zhishi/falvjiangtang/"},{label: "侵权责任法", uri: "/zhishi/qqzrf/"},{label: "职业病防治法", uri: "/zhishi/zhybfzhif/"},{label: "房产纠纷", uri: "/zhishi/fangchanjiufen/"},{label: "招标投标", uri: "/zhishi/zhaobiaotoubiao/"},{label: "合同法", uri: "/zhishi/hetongfa/"},{label: "仲裁法", uri: "/zhishi/zhongcaifa/"},{label: "物权法", uri: "/zhishi/wuquanfa/"},{label: "合伙加盟", uri: "/zhishi/hehuojiameng/"},{label: "行政诉讼法", uri: "/zhishi/xingzhengsusongfa/"},{label: "行政复议法", uri: "/zhishi/xingzhengfuyifa/"},{label: "刑事诉讼法", uri: "/zhishi/xingshisusongfa/"},{label: "电子商务", uri: "/zhishi/dianzishangwu/"},{label: "海事海商", uri: "/zhishi/haishihaishang/"},{label: "行政处罚法", uri: "/zhishi/xingzhengchufafa/"},{label: "行政许可法", uri: "/zhishi/xingzhengxukefa/"},{label: "法律案例", uri: "/falvanli/"},{label: "法律文书", uri: "/falvwenshu/"},{label: "律师营销", uri: "/lvshiyingxiao/"},{label: "合同范本", uri: "/hetongfanben/"},{label: "法律援助", uri: "/falvyuanzhu/"},{label: "诉讼指南", uri: "/susongzhinan/"},{label: "金融证券", uri: "/zhishi/jinrongzhengquan/"},{label: "法律论文", uri: "/falvlunwen/"}];

async function getFirstList (cat) {
	const url = `http://www.fabang.com${cat.uri}`;
	const html = await httpGet(url);
	const { window } = new JSDOM(html);
	const $ = jQuery(window);

	try {
		const catNum = Number($('.pagelist>li:eq(2)>a').attr('href').match(/^list_(\d+)_\d+\.html$/)[1]);
		const totalPages = Number($('.pageinfo>strong:first').text());
		return { totalPages, catNum };
	}
	catch (e) {
		console.warn(`${cat.label}: Failed to get Category Number, set totalPages to 1.`);
		return { totalPages: 1, catNum: null }
	}
}

async function getList (cat, currentPage) {
	const url = `http://www.fabang.com${cat.uri}` + ( cat.num ? `list_${cat.num}_${currentPage}.html` : '');
	const html = await httpGet(url);
	const { window } = new JSDOM(html);
	const $ = jQuery(window);
	
	$('.classu .limast').each(async (index, el) => {
		
		const qa = new Qa();

		qa.q = $(el).find('.name>a').text();
		qa.url = $(el).find('.name>a').attr('href');
		qa.cat = cat.label;
		qa.tags = [$(el).find('.date:first>a').text()];
		qa.date = new Date($(el).find('.date:last').text());

		try {
			await qa.save();
		}
		catch (e) {
			// console.error(e.message);
		}
	});
}

async function getDetail (qa) {	
	// console.log(`get ${qa.url}`);
	const html = await httpGet(qa.url);
	const { window } = new JSDOM(html);
	const $ = jQuery(window);
	const content = $('.content').html();
	if (!content) {
		console.warn(`no content find in page: ${qa.url}`);
		return await qa.remove();
	}
	qa.a = content;
	qa.a = qa.a.replace(/\s*<div class="gg200x300">[\s\S]*?<\/div>\s*/g, '');
	qa.a = qa.a.replace(/<p>　　<strong>相关阅读：<\/strong><\/p>[\s\S]*<a href="http:\/\/www.fabang.com"><img src="http:\/\/www.fabang.com\/favicon.ico" alt=""><\/a>/, '');
	qa.a = qa.a.replace(/<img.*?>/g, '');
	qa.a = qa.a.replace(/ style="text-align: center;"/g, '');
	// console.log(qa.a);
	return qa.save();
}

// cats.forEach(async cat => {
// 	try {
// 		const { totalPages, catNum } = await getFirstList(cat);
// 		cat.totalPages = totalPages;
// 		cat.num = catNum;
// 		let currentPage = 1;
// 		while (currentPage <= totalPages) {
// 			try {
// 				await getList(cat, currentPage)
// 				currentPage++;
// 			}
// 			catch (e) {
// 				console.error(e.message);
// 			}
// 		}
// 	}
// 	catch (e) {
// 		console.error(cat.label, e);
// 	}
// });

const queue = [];

Qa.find({source: 'fabang', a: {$exists: false}}).cursor().on('data', qa => {
	queue.push(qa);
});

setTimeout(() => {
	getQueueDetail(queue);
}, 100);

async function getQueueDetail(queue) {
	const qa = queue.shift();
	try {
		await getDetail(qa);
	}
	catch (e) {
		if (e.status === 403 || e.status === 404) {
			await qa.remove();
			console.log(`Removed ${qa.url}`);
		}
	}
	await sleep(1000);
	getQueueDetail(queue);
}
