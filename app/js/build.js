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
  
  angularTreeview.Nodecurent.add_node_id("3-1-1-2-4");
  
  angularTreeview.Nodecurent
  .addchildren("WordPress","0-0","",[])
  .addchildren("OwnCloud","3-1-1-2","input",[]).prec()
  .addchildren("Add-Db","3-1-1-2-8","select",["Manuel","Mysql","post"])
  .addchildren("Data","3-1-1-2-4","",[])
  .addchildren("Dbname","3-1-1-2-6","input",["dbname"])
    .Set_attrs("affichecontrole",false)
    .Set_attrs("affichesubmit",true)
   
    .add_children_id("3-1-1-2-4","dedede","3-1-1-2-7","input",["dededede"]);
  
  console.log(angularTreeview.Nodecurent.Get_attrs("affichecontrole"));
  console.log(angularTreeview.Nodecurent.Get_attrs("affichesubmit"));
    
  angularTreeview.Nodecurent.prec()
  .addchildren("Dbpwd","3-4","input",["pwd"]).prec()
  .addchildren("Dbuser","3-4","input",["user"]).prec().prec()
  .addchildren("Auth","3-1-1-2-4","",[])
  .addchildren("Pwd","3-4","input",["pwd"]).prec().prec()
  .addchildren("Conf","3-1-1-2-4","",[])
  .addchildren("Cport","3-4","input",["5300"]).prec().prec().prec()
  .addchildren("ADD-Serveur-Web","3-1-1-2-4","select",["Manuel","Apache"])
  .addchildren("Root-directory","3-4","input",["/var/www"]).affiche_arbre()
  this.provide = $stateParams.provide;
 
  console.log(angularTreeview.Nodecurent.search_attribut('id',"3-1-1-2-6").id)
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


angular.module("angularTreeview",['warmonic.lib.logger'])
.factory('angularTreeview', ['logger',function(logger) {
  var TREENAME = {
    valtree:'',
    Noderoot:null,
    Nodecurent:null,
    Selectednode:null,
    // objet node
    Node:function(label,id,typecontrole,tabval,parentobj){
       this.children = [];
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
        this.getrootnode=function(){
          return TREENAME.Noderoot;
        }
      this.addbrother=function(label,id,typecontrole,tabval){
        var a=new TREENAME.Node(label,id,typecontrole,tabval,this.parentnode);
        return this.addbrothernode(a);
      }
      
      this.prec=function(){
        return this.parentnode;
      }
   
     this.affiche_arbre=function(){
       this.niveau=0,self=this
       this.affiche=function(obj,niveau){
         var niveaua=niveau;
         var str=''
         for(var i=0;i<=niveaua;i++) str+=' ';
         console.log(str+obj.label+":"+obj.typecontrole+":"+obj.id);
         angular.forEach(obj.children, function(value){
            self.affiche(value,niveaua+3);
         })
       }
      this.affiche(TREENAME.Noderoot,0)
    }
    
    this.search_attribut=function(nameattribut,valattribut){
      self=this;
      this.objtrouve=null;
      this._search=function(obj){
        if(self.objtrouve==null) { 
          if(obj[nameattribut] == valattribut) {
            self.objtrouve = obj;
          }else
          {
            angular.forEach(obj.children, function(value){
              if(self.objtrouve==null)self._search(value);          
            })
          }
        }
      }
      this._search(TREENAME.Noderoot);
      return this.objtrouve;
    }
    
    this.search_id=function(id){
      return this.search_attribut("id",id)
    }
    
    this.add_children_id=function(id_name,label,id,typecontrole,tabval){
    // search node for include node
      var children_ordre,node_niveau=id_name
      var n = id_name.lastIndexOf(":"); 
      n==-1?children_ordre=0:(children_ordre=parseInt(id_name.slice(n+1)),node_niveau=id_name.slice(0,n))
      var n = id_name.lastIndexOf("-");
      var findnoeud =  this.search_id(node_niveau);
      if(findnoeud!=null)
        return findnoeud.addchildren(label,id,typecontrole,tabval)
        else
          return TREENAME.Nodecurent;
    }
      
    this.add_node_id=function(id_name,node){
      var children_ordre,node_niveau=id_name
      var n = id_name.lastIndexOf(":"); 
      n==-1?children_ordre=0:(children_ordre=parseInt(id_name.slice(n+1)),node_niveau=id_name.slice(0,n))
      var n = id_name.lastIndexOf("-");
      var findnoeud =  this.search_id(node_niveau);
      if(findnoeud != null)
        return findnoeud.addchildrennode(node)
        else
          return TREENAME.Nodecurent;
    }
    },// end node object
  };//TREENAME
  return TREENAME;
}])

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
