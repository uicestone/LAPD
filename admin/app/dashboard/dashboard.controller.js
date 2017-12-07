(function () {
    'use strict';

    angular.module('app.dashboard')
        .controller('DashboardCtrl', ['$scope', DashboardCtrl])

    function DashboardCtrl($scope) {

        var categories = ['刑事', '海商', '家庭', '房产', '公司'];
        var days = ['12/12', '12/13', '12/14', '12/15', '12/16', '12/17', '12/18'];

        var data = [['12/18','刑事',5],['12/18','海商',1],['12/18','家庭',2],['12/18','房产',4],['12/18','公司',1],['12/17','刑事',7],['12/17','家庭',2],['12/17','房产',2],['12/17','公司',6],['12/16','刑事',1],['12/16','海商',1],['12/16','家庭',2],['12/16','房产',1],['12/16','公司',9],['12/15','刑事',7],['12/15','海商',3],['12/15','家庭',4],['12/15','房产',7],['12/15','公司',14],['12/14','刑事',1],['12/14','海商',3],['12/14','家庭',4],['12/14','房产',2],['12/14','公司',4],['12/13','刑事',2],['12/13','海商',1],['12/13','家庭',1],['12/13','房产',5],['12/13','公司',10],['12/12','刑事',1],['12/12','房产',2],['12/12','公司',1]];

        $scope.catHeatmap = {};
        $scope.catHeatmap.options = {
            title: {
                text: '近7天各类咨询次数'
            },
            tooltip: {
                position: 'top'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '6%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: days,
                axisLabel: {
                    interval: 0,
                    rotate: 35
                },
                splitArea: {
                    show: true
                }
            },
            yAxis: {
                type: 'category',
                data: categories,
                splitArea: {
                    show: true
                }
            },
            visualMap: {
                type: 'continuous',
                min: 0,
                max: Math.max.apply(null, data.map(function (value) { return value[2]; })),
                calculable: false,
                orient: 'horizontal',
                left: 'right',
                top: '0',
                inRange: {color: ['#FFE0B2', '#FF9800', '#E65100']}
            },
            series: [{
                name: '对象数量',
                type: 'heatmap',
                data: data,
                label: {
                    normal: {
                        show: true
                    }
                },
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };

        $scope.dailyTotalTime = {};
        $scope.dailyTotalTime.options = {
            title: {
                text: '近7天咨询时长'
            },
            tooltip : {
                trigger: 'axis'
            },
            legend: {
                data: categories
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis : [
                {
                    type : 'category',
                    boundaryGap : false,
                    data : ['12/12','12/13','12/14','12/15','12/16','12/17','12/18']
                }
            ],
            yAxis : [
                {
                    type : 'value'
                }
            ],
            series : [
                {
                    name:'刑事',
                    type:'line',
                    stack: '总量',
                    areaStyle: {normal: {}},
                    data:[120, 132, 101, 134, 90, 230, 210]
                },
                {
                    name:'海商',
                    type:'line',
                    stack: '总量',
                    areaStyle: {normal: {}},
                    data:[220, 182, 191, 234, 290, 330, 310]
                },
                {
                    name:'家庭',
                    type:'line',
                    stack: '总量',
                    areaStyle: {normal: {}},
                    data:[150, 232, 201, 154, 190, 330, 410]
                },
                {
                    name:'房产',
                    type:'line',
                    stack: '总量',
                    areaStyle: {normal: {}},
                    data:[320, 332, 301, 334, 390, 330, 320]
                },
                {
                    name:'公司',
                    type:'line',
                    stack: '总量',
                    label: {
                        normal: {
                            show: true,
                            position: 'top'
                        }
                    },
                    areaStyle: {normal: {}},
                    data:[820, 932, 901, 934, 1290, 1330, 1320]
                }
            ]
        };

        $scope.enterSources = {};
        $scope.enterSources.options = {
            title: {
                text: '嫌疑对象来源'
            },
            tooltip: {
                trigger: 'item',
                formatter: "{b}: {c} ({d}%)"
            },
            legend: {
                orient: 'vertical',
                x: 'left',
                y: 'bottom',
                data:['刑事','行政', '传唤','拘传','扭送','自首']
            },
            series: [
                {
                    name:'案件性质',
                    type:'pie',
                    selectedMode: 'multiple',
                    radius: [0, '40%'],

                    label: {
                        normal: {
                            position: 'inner'
                        }
                    },
                    labelLine: {
                        normal: {
                            show: false
                        }
                    },
                    data:[
                        {value:335, name:'刑事', selected:true},
                        {value:679, name:'行政'}
                    ]
                },
                {
                    name:'来源类型',
                    type:'pie',
                    radius: ['55%', '78%'],

                    data:[
                        {value:335, name:'传唤'},
                        {value:310, name:'拘传'},
                        {value:234, name:'扭送'},
                        {value:135, name:'自首'}
                    ]
                }
            ]
        };

        $scope.exitType = {};
        $scope.exitType.options = {
            title: {
                text: '嫌疑对象去向'
            },
            tooltip: {
                trigger: 'item',
                formatter: "{b}: {c} ({d}%)"
            },
            legend: {
                orient: 'vertical',
                x: 'left',
                y: 'bottom',
                data:['释放','戒毒','拘留']
            },
            series: [
                {
                    name:'去向',
                    type:'pie',
                    selectedMode: 'multiple',
                    data:[
                        {value:335, name:'戒毒', selected:true},
                        {value:310, name:'释放', selected:true},
                        {value:234, name:'拘留', selected:true}
                    ]
                }
            ]
        };

        $scope.closeType = {};
        $scope.closeType.options = {
            title: {
                text: '案件办结类型'
            },
            tooltip: {
                trigger: 'item',
                formatter: "{b}: {c} ({d}%)"
            },
            legend: {
                orient: 'vertical',
                x: 'left',
                y: 'bottom',
                data:['刑事','行政','涉黄','涉赌','涉毒','其他']
            },
            series: [
                {
                    name:'案件性质',
                    type:'pie',
                    selectedMode: 'multiple',
                    radius: [0, '40%'],

                    label: {
                        normal: {
                            position: 'inner'
                        }
                    },
                    labelLine: {
                        normal: {
                            show: false
                        }
                    },
                    data:[
                        {value:335, name:'刑事', selected:true},
                        {value:679, name:'行政'}
                    ]
                },
                {
                    name:'来源类型',
                    type:'pie',
                    radius: ['55%', '78%'],

                    data:[
                        {value:335, name:'涉黄'},
                        {value:310, name:'涉赌'},
                        {value:234, name:'涉毒'},
                        {value:135, name:'其他'}
                    ]
                }
            ]
        };

        $scope.punishRate = {};
        $scope.punishRate.options = {
            title: {
                text: '来源处罚比例'
            },
            legend: {
                orient: 'horizontal',
                x: 'right',
                y: 'top',
                data:['行政拘留','刑事拘留','取保候审']
            },
            tooltip : {
                trigger: 'axis',
                axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                    type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis : [
                {
                    type : 'category',
                    data : ['传唤','拘传','扭送','自首']
                }
            ],
            yAxis : [
                {
                    type : 'value',
                    max: 'dataMax',
                    axisLabel: {
                        formatter: function(value) {
                            return Math.round(value * 100) + '%'
                        }
                    }
                }
            ],
            series : [
                {
                    name:'行政拘留',
                    type:'bar',
                    stack: '处罚',
                    data:[0.01, 0.07, 0.4, 0.02]
                },
                {
                    name:'刑事拘留',
                    type:'bar',
                    stack: '处罚',
                    data:[0.005, 0.03, 0.55, 0.9]
                },
                {
                    name:'取保候审',
                    type:'bar',
                    stack: '处罚',
                    data:[0.001, 0.008, 0.03, 0.08]
                }
            ]
        };
    }
})(); 
