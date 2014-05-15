'use strict';

angular.module('warmonic.build', [
  'warmonic.lib.logger',
  'warmonic.lib.xmpp.commands',
  'angularTreeview'
])

.controller('buildCtrl', ['$timeout', '$state', '$stateParams', 'logger', 'xmpp', 'commands','angularTreeview', function($timeout, $state, $stateParams, logger, xmpp, commands, angularTreeview) {
		      //-----a supprimer-----------
		      this.rawInput=function(data) { console.log('RECV: ' + data);};
		      this.rawOutput=function(data) { console.log('SENT: ' + data);};
		      if (xmpp._connection){
			xmpp._connection.rawInput=this.rawInput;
			xmpp._connection.rawOutput=this.rawOutput;
		      }
		      //----------------------------
  this.treedata=[];
   this.treedata.push(new angularTreeview.Node("Varnish","0","",[]));
     angularTreeview.Nodecurent
    .addchildren("WordPress","0-0","",[])
    .addchildren("OwnCloud","O-0-0","input",[]).prec()
    .addchildren("Add-Db","3-1-1-2-4","select",["Manuel","Mysql","post"])
    .addchildren("Data","3-1-1-2-4","",[])
    .addchildren("Dbname","3-1-1-2-6","input",["dbname"]).prec()
    .addchildren("Dbpwd","3-1-1-2-6","input",["pwd"]).prec()
    .addchildren("Dbuser","3-1-1-2-6","input",["user"]).prec().prec()
    .addchildren("Auth","3-1-1-2-4","",[])
    .addchildren("Pwd","3-1-1-2-6","input",["pwd"]).prec().prec()
    .addchildren("Conf","3-1-1-2-4","",[])
    .addchildren("Cport","3-1-1-2-6","input",["5300"]).prec().prec().prec()
    .addchildren("ADD-Serveur-Web","3-1-1-2-4","select",["Manuel","Apache"])
    .addchildren("Root-directory","3-1-1-2-6","input",["/var/www"])
  this.provide = $stateParams.provide;
       
// build provide
//var cmd = commands.create('mss-master@im.aeolus.org/master', this.provide),
//   self = this;
  //commands.execute(cmd).then(
//       function(cmd) {
// 	var result = cmd.form.toJSON();
// 	result.items.forEach(function(item) {
// 	  var provide = {
// 	    'xpath': item.fields[0].values[0],
// 	    'tags': item.fields[1].values[0].split(','),
// 	    'label': item.fields[2].values[0],
// 	    'desc': item.fields[3].values[0]
// 	  };
}]);
//--------------------------------------------
// code adapter from 
// https://github.com/eu81273/angular.treeview
//--------------------------------------------


angular.module("angularTreeview",[])
.factory('angularTreeview', function() {
  var TREENAME = {
    valtree:'',
    Noderoot:null,
    Nodecurent:null,
    Selectednode:null,
    // objet node
    Node:function(label,id,typecontrole,tabval,parentobj){
      this.label=label;
      this.typecontrole=typecontrole;
      this.tabval=tabval;
      this.id = id;
      this.affichesubmit=false;
      this.controle="";
      this.valselection=tabval[0];
      this.affichecontrole=true;
      this.information ="";
      this.intitule="";
      this.children = [];
      this.parentnode=null;
      if(typecontrole=="" || typecontrole==null ) {
	this.typecontrole="";
	this.affichesubmit=false;
	this.affichecontrole=false;
      }
      if(TREENAME.Nodecurent== null) TREENAME.Nodecurent = this;
      if(TREENAME.Noderoot== null)   TREENAME.Noderoot   = this;
      if(parentobj != null)
	this.parentnode = parentobj;
      else 
	this.parentnode = TREENAME.Noderoot;
      
      this.attrs=function(){
	array_attribut=[]
        array_attribut.push({'label':this.label})
	array_attribut.push({'typecontrole':this.typecontrole})
	array_attribut.push({'tabval':this.tabval})
	array_attribut.push({'id':this.id})
	array_attribut.push({'affichesubmit':this.affichesubmit})
	array_attribut.push({'controle':this.controle})
	array_attribut.push({'valselection':this.valselection})
	array_attribut.push({'affichecontrole':this.affichecontrole})
	array_attribut.push({'information':this.information})
	array_attribut.push({'intitule':this.intitule})
	array_attribut.push({'children':this.children})
	array_attribut.push({'parentnode':this.parentnode})
	return array_attribut;
      }
	  
      this.addchildrennode=function(node){
	TREENAME.Nodecurent=node;
	node.parentnode=this;
	this.children.push(node);
	return node;
      }
      
      this.addchildren=function(label,id,typecontrole,tabval){
	var a = new TREENAME.Node(label,id,typecontrole,tabval,this);
	return this.addchildrennode(a);
      }
	
      this.addbrothernode=function(node){
	if(this.parentnode==null) TREENAME.Nodecurent.addchildrennode(node);
	TREENAME.Nodecurent=node;
	node.parentnode=this.parentnode;
	this.parentnode.children.push(node);
	return node;
      }
	
      this.addbrother=function(label,id,typecontrole,tabval){
	var a=new TREENAME.Node(label,id,typecontrole,tabval,this.parentnode);
	return this.addbrothernode(a);
      }
      
      this.prec=function(){
	return this.parentnode;
      }
      
      this.search=function(id,valeur){
	this.a=null;
	return TREENAME.search_id(TREENAME.Noderoot,id,valeur)
      }
    },// end node object
    search_id:function(obj,namesearch,valeur){
      this.a=null;
      this.namesearch=namesearch;
      this.valeur=valeur;
      parentobj=this;
      console.log(obj[this.namesearch])
      this._search=function(obj){
	if(obj[this.namesearch] == this.valeur){
	  this.a = obj;
	  return this.a;
	}else
	{
	  angular.forEach(obj.children, function(value){
	    this.a=parentobj._search(value);
	    if(this.a != null) {
	      return this.a;
	    }
	  });
	}
	return this.a;
      };
      this.a = this._search(obj);
      if(this.a == null ) this.a = TREENAME.Nodecurent;
      return this.a;
    },
  };//TREENAME
  return TREENAME;
})
.controller('treeCtrl',
  function($scope,angularTreeview){
    $scope.selectednode=null;
    $scope.changevalue=function(type,id,val,select,node){
      if(!node) return;
      node.valselection=select
      node.valselection=select
      angularTreeview.Selectednode=$scope.currentNode
    }
    
    $scope.blurvalue=function(type,id,val,select,node){
       if(!node) return;
      node.valselection=select
       angularTreeview.Selectednode=$scope.currentNode
    }
    
    $scope.process=function(type,id,val,select,node){
      if(!node) return;
      node.valselection=select
      if(node.valselection!="")
	node.affichesubmit=false;
      angularTreeview.Selectednode=$scope.currentNode
    }
  }
)
.directive("treeModel",function($compile){
  return{
    restrict:"A",
    link:function(scope,element,attrs){
      var treeModel=attrs.treeModel,
      label=attrs.nodeLabel||"label",
      controle=attrs.nodecontrole||"controle",
      id=attrs.nodeId||"id",
      valselection=attrs.nodeselect||"select",
      information=attrs.nodeinfos||"information",
      tabval=attrs.nodetabval||"tabval",
      intitule=attrs.nodeintitule||"intitule",
      conteneur=attrs.nodeconteneur||"conteneur",
      affichecontrole=attrs.nodeaffichecontrole||"affichecontrole",
      affichesubmit=attrs.nodeaffichesubmit||"affichesubmit",
      typecontrole=attrs.nodetypecontrole||"typecontrole",//input or select or checkbox or radioyesno
      descriptif=attrs.nodedecriptif||"descriptif",
      children=attrs.nodechildren||"children",
      disabled     = ' ng-disabled="!node.selected" ',
      selection    = ' ng-model="node.'+ valselection +'" ',
      showtype=function(typectl){
	return ' ng-show="node.' + typecontrole + '==\''+typectl+'\'" ';
      },
      
      sumitbutton=function(){
	return '<a ng-show="!!(node.'+affichesubmit+'&&node.selected)" ng-disabled="!node.selected" href="#" ng-click="process(node.' + typecontrole + ',node.' + id + ',node.' + tabval + ',node.' + valselection+',node)"><img src="img/process.png"></a>';
      },
      
      change=' ng-change="changevalue(node.' +typecontrole+',node.'+id+',node.'+tabval+',node.'+valselection+',node)" ',
      init=' ng-init="node.' + valselection + '=node.'+tabval+'[0]" ',
      blur = ' ng-blur="blurvalue(node.'+typecontrole+',node.'+id+',node.'+ tabval+',node.'+valselection+')" ',
      
      template=
	'<ul>'+
	  '<li data-ng-repeat="node in '+treeModel+'">'+
	    '<i class="collapsed" data-ng-show="node.'+children+'.length && node.collapsed"'+
	      ' data-ng-click="selectNodeHead(node, $event)">'+
	    '</i>'+
	    '<i class="expanded" data-ng-show="node.'+children+'.length && !node.collapsed"'+
	      ' data-ng-click="selectNodeHead(node, $event)">'+
	    '</i>'+
	    '<i class="normal" data-ng-hide="node.'+children+'.length"></i>'+
	    
	    '<span data-ng-class="node.selected" data-ng-click="selectNodeLabel(node, $event)">'+
	      '{{node.'+label+'}}'+
	    '</span>'+
      
	    '<span ng-show="!!node.'+affichecontrole+'">'+
	      '<b>{{node.'+intitule+'}} </b> :'+
	      
	      '<span  class="centerradio" '+ showtype("input")+'>'+
		'<input '+ disabled+ selection+blur+change+init+' id={{id}} type="text">'+
		sumitbutton()+
	      '</span>'+
	      
	      '<span  '+ showtype("email")+'>'+
		'<input '+ disabled+selection+blur+change+init+' id={{id}} type="email">'+
		sumitbutton()+
	      '</span>'+
	      
	      '<span '+ showtype("password")+'>'+
	      '<input '+disabled+selection+blur+change+init+' id={{id}} type="password" >'+
		sumitbutton()+
	      '</span>'+
	      
	      '<span '+showtype("number")+'>'+
		'<input '+disabled+selection+blur+change+init+' id={{id}} type="number">'+
		sumitbutton()+
	      '</span>'+
	      
	      '<span '+showtype("range")+'>'+
		'<input '+disabled+selection+blur+change+ 'min="{{node.'+tabval+'[0]}}" max="{{node.'+tabval+'[1]}}" id={{id}} type="range" >'+
		sumitbutton()+
	      '</span>'+
	      
	      '<span '+showtype("checkbox")+'>'+
		'<input  '+disabled+selection+change+'id={{id}} type="checkbox" value="node.'+tabval+'"/>'+
		sumitbutton()+
	      '</span>'+
	    
	      '<span '+showtype("select")+'>'+
		'<select  '+disabled+selection+change+'>'+
		  '<option ng-repeat="val in node.'+ tabval +' ">{{val}}</option>'+
		'</select>'+
		sumitbutton()+
	      '</span>'+
		
	      '<span class="centerradio" '+showtype("radioyesno")+'>'+ 
		'<span >'+
		  '<span  ng-repeat="val in node.'+tabval+'">'+
		    '<input '+disabled+' type="radio" '+selection+'value="{{val}}"'+
		    change+' name="{{id}}">{{val}}'+
		  '</span>'+
		'</span>'+
		sumitbutton()+
	      '</span>'+
	      
	    '</span>'+
	    
	    '<div data-ng-hide="node.collapsed" data-tree-model="node.'+children+'" data-node-id='+id+
	      ' data-node-controle='+controle+
	      ' data-node-select='+valselection+
	      ' data-node-infos='+information+
	      ' data-node-tabval='+tabval+
	      ' data-node-intitule='+intitule+
	      ' data-node-conteneur='+conteneur+
	      ' data-node-affichecontrole='+affichecontrole +
	      ' data-node-affichesubmit='+affichesubmit +
	      ' data-node-type='+typecontrole +
	      ' data-node-decriptif='+descriptif+
	      ' data-node-label='+label+
	      ' data-node-children='+children+'>'+
	    '</div>'+
	  '</li>'+
	'</ul>';
      treeModel&&treeModel.length&&(attrs.angularTreeview?(scope.$watch(treeModel,function(oldValue,newValue){// This surveille treeModel newValuescope, oldValuescpe
	
	  element.empty().html($compile(template)(scope))
	},!1),
	scope.selectNodeHead=scope.selectNodeHead||function(scope,event){
	  event.stopPropagation&&event.stopPropagation();
	  event.preventDefault&&event.preventDefault();
	  event.cancelBubble=!0;
	  event.returnValue=!1;
	  scope.collapsed=!scope.collapsed;
	},
	scope.selectNodeLabel=scope.selectNodeLabel||function(attrs,event){
	  event.stopPropagation&&event.stopPropagation();
	  event.preventDefault&&event.preventDefault();
	  event.cancelBubble=!0;
	  event.returnValue=!1;
	  scope.currentNode&&scope.currentNode.selected&&(scope.currentNode.selected=void 0);
	  attrs.selected="selected";
	  attrs.activate="activate";
	  scope.currentNode=attrs
	}
      ):element.html($compile(template)(scope)))
    }//end link function
  }//endreturn
})//end directive
