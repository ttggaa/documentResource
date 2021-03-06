/**
 * Filename:
 * Description:
 * Copyright:   Copyright (c) 2013
 * Company:     Shanghai Huateng Software Systems Co., Ltd.
 * @author      shangxiujuan
 * @version     1.0
 * Create at:   2016/11/01
 */
var debtPoolPressDtlController = function($scope,$common,$state,dataDeliver,$eventCommunicationChannel) {
    var bData = dataDeliver.getter();
    var mastContno = bData.mastContno;
    $scope.otherform = bData;
    $scope.otherform.totalNum=0;
    $scope.otherform.totalAmount="0.00";
    var seq;//流程节点顺序
    var processId = window.processId;//流程点
    var process="DebtPoolPressingApply";// 应收账款池融资催收申请
    var appno = window.appNo;
    queryTaskInfo();

    if (appno == null) {
        $scope.disableButton = true; //提交按钮只读
        //催收日期（为催收申请发起日期）
        var date=new Date();
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();
        if(m < 10){
            m = "0" + m;
        }
        if(d < 10){
            d = "0" + d;
        }
        $scope.otherform.insertDate="" + y + m + d;

    } else { //流程中的处理
        $scope.hideback = true; //返回按钮隐藏
        $scope.disableButton = false;
        //通过申请编号查询申请信息获得相关的一些必须参数
      //  queryAppliBaseInfo();
        queryAppliBussInfo();
        //监听分页
        $scope.$watch("conf.pageNo+conf.pageSize", function () {
            $scope.queryTableDebt();
        });
        getCurrentNodeEntity();
    }
    var pressMode = "";//催收方式
    //买方客户查询
    $scope.buyerContent = {
        type: "table",//展示类型table  tree
        url: "bCntDebtExtInfoService/selectBCntDebtExtInfoByPage",//请求url
        param: {businessNo: mastContno},//请求参数,如果不写该属性或者param:{},则以输入当前字段查
        split: "",//分隔符*/
        extentColumn: "buyerName",
        column: ["buyerName"]//展示内容
    };
    $scope.buyerExtent = function (ds) {
        $scope.otherform.custcdBuyer = ds.buyerCustcd;//获得买方客户号
        $scope.otherform.aging = parseFloat(ds.loanDays);//获得账期
        $scope.otherform.gracePeriod = parseFloat(ds.debtGraceDays);//获得宽限期
    };
    $scope.$watch("otherform.cnameBuyer", function () {
        $scope.buyerContent.param = {
            businessNo: mastContno,//将之前查处的业务合同号传参
            buyerName: $scope.otherform.cnameBuyer//买方名称
        }
    });
    //$scope.otherform.insertDate = $scope.otherform.startDate;//催收日期
    $scope.otherform.totalNum = "0";//催收总份数
    $scope.otherform.totalAmount = "0.00";//催收总金额

    //应收账款基本信息
    $scope.datasource = {//初始化表格对象
        ds: []
    };
    $scope.selected = {//初始化对象
        select: []
    };
    $scope.conf = {//初始化分页对象
        pageNo: 1,
        pageSize: 10,
        totalRecord: 0
    };
    //出池应收账款列表
    $scope.queryTableDebt = function(paramData)
    {
        var data= {
            pageNo: $scope.conf.pageNo,
            pageSize: $scope.conf.pageSize,
            debtCommonQryVO:$scope.otherform
        };
        $common.get_asyncData("rDebtPressService/getInvoiceAppList", data).then(function (res) {
            var data;
            if (res.errorCode == "SUC") {
                data = res.contextData;
                $scope.datasource.ds = data.records;
                $scope.conf.totalRecord = data.totalRecord;
                $scope.otherform.totalNum = data.totalRecord;
                var totalAmount = 0;
                for(var i=0;i<$scope.datasource.ds.length;i++)
                {
                    var billsAmount= $scope.datasource.ds[i].remainingAmount;//应收账款余额
                    if(!isNaN(billsAmount)){
                        totalAmount = totalAmount + billsAmount;
                    }
                }
                if(totalAmount==0)
                {
                    $scope.otherform.totalAmount = "0.00";
                }
                else
                {
                    $scope.otherform.totalAmount = totalAmount;
                }
            } else {
                $common.get_tipDialog(res.errorMsg, 'showInform');
            }
        })
    };

    //获取任务信息
    function queryTaskInfo(){
        var data = {
            appno:appno,
            process:process
        };
        $common.get_asyncData("iScfWorkFlowService/findBPbcAppliBaseInfoByAppno",data).then(function (res) {
            var task;
            if (res.errorCode == "SUC") {
                task = res.contextData;
                $scope.taskform = task;
            } else {
                $common.get_tipDialog(res.errorMsg, 'showInform');
            }
        })
    }

    //获取催收申请的信息
    function queryAppliBussInfo(){
        var data = {
            rBcpAppliBussInfo:{
                appno:appno
            }
        };
        $common.get_asyncData("rBcpAppliBussInfoService/findBcpAppliBussInfoByKey",data).then(function (res) {
            var data;
            if (res.errorCode == "SUC") {
                data = res.contextData;
                $scope.otherform = data;
                $scope.otherform.pressMode= data.returnType;
                //$scope.otherform.totalNum =data.debtNum;//催收份数
                // $scope.otherform.totalAmount =data.totalDebtAmount;//应收账款催收总额
            } else {
                $common.get_tipDialog(res.errorMsg, 'showInform');
            }
        })
    }
    //获取催收申请的信息
    function queryAppliBussDtl(){
        var value={
            appno:appno
        };
        var data = {
            pageNo: $scope.conf.pageNo,
            pageSize: $scope.conf.pageSize,
            value:value
        };
        $common.get_asyncData("rBcpAppliBussDtlService/findRBcpAppliBussDtlPageByPage",data).then(function (res) {
            var data;
            if (res.errorCode == "SUC") {
                data = res.contextData;
                $scope.datasource.ds = data.records;
                $scope.conf.totalRecord = data.totalRecord;
            } else {
                $common.get_tipDialog(res.errorMsg, 'showInform');
            }
        })
    }

    //
    //获得当前流程节点的信息
    function getCurrentNodeEntity(){
        var data = {
            pid:processId
        };
        var promise = $common.get_asyncData("processService/getCurrentNodeEntity", {pid: processId});
        promise.then(function (res) {
            if(res.errorCode=="SUC"){
                var flowdata = res.contextData;
                seq = parseFloat(flowdata.seq);
                if (seq > 1) { //提交后的流程
                    //设置只读熟悉
                    $scope.viewdisable =true;
                    //按钮隐藏
                    $scope.viewhide = true;
                };
            }else{
                $common.get_tipDialog(res.errorMsg,'showError');
            }
        })
    }

    //-------------------------------------点击事件----------------------------------
    //当催收方式改变的时候要判断是对应的字段的值是否改变了,如果改变了，则要将对应的票据数据清空
    $scope.pressModeChange=function(val){
        //变化前的值
        var oldVal =  $scope.otherform.pressMode;
        if((oldVal!=null&&oldVal!=""&&oldVal!=undefined)&&val !== oldVal){
            $scope.datasource.ds=[];
            $scope.otherform.totalNum=0;
            $scope.otherform.totalAmount="0.00";
        }
    };
    //买方改变时，清空对应的催收应收账款列表
    $scope.$watch("otherform.custcdBuyer", function (newVal,oldVal) {
        if(oldVal!=null&&newVal !== oldVal){
            $scope.datasource.ds=[];
            $scope.otherform.totalNum=0;
            $scope.otherform.totalAmount="0.00";
        }
    });
    //addBill，deleteBill，save，commit，back returnType
    //添加票据信息（应收账款基本信息和业务合同号）
    $scope.add_onClick = function() {
        if($.doValidate("otherform")){

            $common.get_ngDialog('debtPoolPress/debtBaseInfoAdd.html', $scope
                ,["$scope",function(dialogScope){
                    //查询参数的组装
                    dialogScope.conditionForm={
                        mastContno:$scope.otherform.mastContno,
                        flag:$scope.otherform.pressMode,  //催收方式
                        appno_Q:$scope.otherform.appno,
                        custcdSaller_Q:$scope.otherform.custcdSaller,//卖方客户号
                        custcdBuyer_Q:$scope.otherform.custcdBuyer,//买方客户号
                        bussType_Q:$scope.otherform.bussType//业务品种
                    };//初始化查询条件
                    dialogScope.datasource={//初始化表格对象
                        ds: []
                    };
                    dialogScope.selected={//初始化对象
                        select: []
                    };
                    dialogScope.conf= {//初始化分页对象
                        pageNo: 1,
                        pageSize: 10,
                        totalRecord: 0};
                    //监听分页
                    dialogScope.$watch("conf.pageNo+conf.pageSize",function() {
                        dialogScope.queryTable();
                    });
                    //重置
                    dialogScope.rebort_onClick = function(){
                        dialogScope.$apply(function(){
                           // dialogScope.conditionForm={};
                            dialogScope.conditionForm.billsDate_from_Q = "";
                            dialogScope.conditionForm.billsDate_to_Q = "";
                            dialogScope.conditionForm.debtEnd_from_Q = "";
                            dialogScope.conditionForm.debtEnd_to_Q = "";
                            dialogScope.conditionForm.billsNo_Q = "";
                            dialogScope.conditionForm.billsType_Q = "";
                            dialogScope.selected.select=[];//清空选项
                            dialogScope.queryTable();
                        })
                    };
                    //搜索
                    dialogScope.submit_onClick =function(){
                        dialogScope.queryTable();
                    };
                    dialogScope.queryTable = function(){
                        var data= {
                            pageNo: dialogScope.conf.pageNo,
                            pageSize: dialogScope.conf.pageSize,
                            debtCommonQryVO:dialogScope.conditionForm
                        };
                        var promise = $common.get_asyncData("rDebtPressService/getDebtInvoiceInfoPressing",data);
                        promise.then(function(res){
                            var data;
                            if (res.errorCode =="SUC"){
                                data = res.contextData;
                                dialogScope.datasource.ds = data.records;
                                dialogScope.conf.totalRecord = data.totalRecord;
                                //选中记录
                                dialogScope.selected.select=$common.copy($scope.datasource.ds);
                            }else{
                                $common.get_tipDialog(res.errorMsg,'showError');
                            }
                        });
                    };
                    dialogScope.confirm_onClick = function(){
                        $scope.selected.select=[];
                        if(dialogScope.selected.select.length <= 0){
                            $common.get_tipDialog('请至少选择一条记录','showInform');
                            return false;
                        }
                        //转让出质总金额要判断不能大于合同的金额
                        var selected=dialogScope.selected.select;
                        var totalAmount=0;//催收总金额
                        var totalNum=0;//催收份数
                        //计算票面金额的总额，计算费用。
                        for(var k in selected){
                            totalAmount=parseFloat(totalAmount)+parseFloat(selected[k].remainingAmount);
                            totalNum=totalNum+1;
                        }
                        $scope.otherform.totalAmount=totalAmount;
                        $scope.otherform.totalNum=totalNum;
                        //赋值到上一个页面
                        $scope.datasource.ds=[];
                        $scope.datasource.ds = $common.copy(dialogScope.selected.select);
                        $scope.$apply();
                        dialogScope.closeThisDialog();
                    };
                    dialogScope.closeThisDialog_onClick = function(){
                        dialogScope.closeThisDialog();
                    };
                }],"添加页面",{showClose:false});
        }

    };
    //删除票据信息
   $scope.delete_onClick = function() {
        if ($scope.selected.select.length != 1) {
            $common.get_tipDialog('请选择一条记录！', 'showInform');
        } else {
                var dsArray = $scope.datasource.ds;
                var selected = $scope.selected.select[0];
                for (var i = 0; i < dsArray.length; i++) {
                    if (dsArray[i].billsNo == selected.billsNo) {
                        $scope.datasource.ds.splice(i, 1);
                        $scope.selected.select = [];
                        //改变催收总金额，催收份数，费用总额，实收费用
                        $scope.otherform.totalNum = parseFloat($scope.otherform.totalNum) - 1;//催收份数减一
                        if($scope.otherform.totalNum == 0){//没有出质票据,全部置空
                            $scope.otherform.totalAmount="0.00";//催收票据总金额
                            $scope.$apply();
                        }else{
                            $scope.otherform.totalAmount = parseFloat($scope.otherform.totalAmount) - (selected.billsAmountView);//催收总金额
                            $scope.$apply();
                        }
                    }
                }
        }
    };
    //直接保存并发起流程
    $scope.save_onClick = function(){
        if($.doValidate("otherform")) {
            if ($scope.datasource.ds.length <= 0) {
                $common.get_tipDialog("请先添加应收账款后再提交!", 'showInform');
                return false;
            }
            var data = {
                debtBussInfoVO: $scope.otherform,
                debtBillsInfoVOList: $scope.datasource.ds
            };
            var primise = $common.get_asyncData("rDebtPressService/saveDebtPressWriteApply", data);
            primise.then(function (res) {
                if (res.errorCode == "SUC") {
                    data = res.contextData;
                    $scope.otherform.appno=data.value;
                    dataDeliver.setter( $scope.otherform);
                    $scope.disableButton= false;
                    $common.get_tipDialog('保存成功！', 'showSuccess');
                    //$state.go("bsysthreeProtocol");
                } else {
                    $common.get_tipDialog(res.errorMsg, 'showError');
                }
            });
        }
    };

    //提交
    $scope.sumbit_onClick = function(){
        if($.doValidate("otherform")) {
            if ($scope.datasource.ds.length <= 0) {
                $common.get_tipDialog("请先添加应收账款后再提交！", 'showInform');
                return false;
            }
            var data = {
                debtBussInfoVO: $scope.otherform,
                debtBillsInfoVOList: $scope.datasource.ds
            };
            var primise = $common.get_asyncData("rDebtPressService/saveDebtPressWriteSubmit", data);
            primise.then(function (res) {
                if (res.errorCode == "SUC") {
                    if($state.current.name=="debtPoolPressDtlApp") {
                        $scope.viewhide=true;
                        $scope.hideback=true;
                    }else{
                        $state.go("debtPoolConList");
                    }
                        //$scope.queryTable();
                    //$scope.selected.select = [];
                    $common.get_tipDialog('提交成功！', 'showSuccess');
                    //$state.go("bsysthreeProtocol");
                } else {
                    $common.get_tipDialog(res.errorMsg, 'showError');
                }
            });
        }
    };
    //返回按钮
    $scope.back_onClick = function() {
        $state.go("debtPoolConList");
    }
};
