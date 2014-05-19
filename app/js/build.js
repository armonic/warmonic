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
  this.children=[];
   this.children.push(new angularTreeview.Node("Varnish","0","",[]));
     angularTreeview.Nodecurent
    .addchildren("WordPress","0-0","",[])
    .addchildren("OwnCloud","O-0-0","input",[]).prec()
    .addchildren("Add-Db","3-1-1-2-4","select",["Manuel","Mysql","post"])
    .addchildren("Data","3-1-1-2-4","",[])
    
    .addchildren("Dbname","3-1-1-2-6","input",["dbname"])
      .Set_attrs("affichecontrole",false)
      .Set_attrs("affichesubmit",true);
    console.log(angularTreeview.Nodecurent.Get_attrs("affichecontrole"));
    console.log(angularTreeview.Nodecurent.Get_attrs("affichesubmit"));
      
    angularTreeview.Nodecurent.prec()
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
//   s.create('mss-master@im.aeolus.org/master', this.provide),
//   self = this;
//   commands.execute(cmd).then(
//     function(cmd) {
//       var result = cmd.form.toJSON();
//      // process_tree(result);
// 
//   
//     });
  
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
	var array_attribut=[];
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
      
      this.Set_attrs=function(attribut,valeur){
	var array_attribut=this.attrs();
	angular.forEach(array_attribut, function(items){
	  for(var p in items)
	  {
	    if(attribut==p) {
	      TREENAME.Nodecurent[p]=valeur;
	      return TREENAME.Nodecurent;
	    }
	  }
	});
	return this;
      }
      
      this.Get_list_key_attrs=function(){
	return ['label','typecontrole','tabval','id','affichesubmit','controle','valselection','affichecontrole','information','intitule','children','parentnode'];
      }
      
      this.Get_attrs=function(attribut){
	var array_attribut=this.attrs(),
	p="",k='';
	angular.forEach(array_attribut, function(items){
	  for(p in items){
	    if(attribut==p) {
	      k=TREENAME.Nodecurent[p];
	      return k;
	    }
	  }
	});
	return k
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
  function($scope,angularTreeview,$http, $templateCache){
    $scope.selectednode=null;
    $scope.changevalue=function(type,id,val,select,node){
      if(!node) return;
      node.valselection=select
      node.valselection=select
      angularTreeview.Selectednode=$scope.currentNode
    }
 
    $scope.blurvalue=function(type,id,val,select,node){
      console.log("jjjjjjjjjjjjjjjjjjjjjjjjj")
       if(!node) return;
      node.valselection=select
       angularTreeview.Selectednode=$scope.currentNode
    }
    
    $scope.process=function(type,id,val,select,node){
       console.log("ppppppppppppppppppppppppppppppppppppp")
      if(!node) return;
      node.valselection=select
      if(node.valselection!="")
	node.affichesubmit=false;
      angularTreeview.Selectednode=$scope.currentNode
    }
  }
)

.directive("treeModel",function($compile,$http, $templateCache){
  return{
    restrict:"A",
    link:function(scope,element,attrs){
      var k=''
      var treeModel=attrs.treeModel;
      var loader = $http.get('partials/_tree.html', {cache: $templateCache});
      var promise = loader.success(function(template) {
      k=eval(template)
	treeModel&&treeModel.length&&
	( attrs.angularTreeview?(scope.	$watch(treeModel,function(oldValue,newValue){
	      element.empty().html($compile(k)(scope))
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
	  ):element.html($compile(k)(scope)))
	}).then(function (response) {

      });
    }//end link function
  }//endreturn
})//end directive
