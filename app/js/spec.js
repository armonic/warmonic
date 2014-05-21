 
var contrainte = angular.module( "contrainte",['ngSanitize']);
        contrainte.controller(
            "controleur_contrainte",
  function( $scope ) {
        $scope.VM_type="mbs" // donnée à recupérer aussi
        $scope.regle=""    // correspond au fichier resultat de spécifications 
        $scope.ez=[]
       
        $scope.countProperties=function (obj) {
          var count = 0;
          for(var prop in obj) {
              if(obj.hasOwnProperty(prop))
                  ++count;
          }
          return count;
        }
        
        $scope.init=function() {//actuellement pas utiliser
                $scope.component ={
        "component_types": [
                {
                    "name"     : "HTTP-proxy-load-balancer",
                    "provide"  : [["@Varnish/Active/start", ["FiniteProvide", 1]]],
                    "require"  : [["@Wordpress/ActiveWithNfs/get_website", 3]]
                },
                {
                        "name"     : "Wordpress",
                        "provide"  : [["@Wordpress/ActiveWithNfs/get_website", ["FiniteProvide", 1]]],
                        "require"  : [["@Mysql/Active/addDatabase", 1], 
                                      ["@Nfs_server/Active/get_dir", 1]]
                },
                {
                        "name"     : "MySQL",
                        "provide"  : [["@Mysql/Active/addDatabase", ["FiniteProvide", 3]]]
                },
                {
                        "name"     : "Nfs_server",
                        "provide"  : [["@Nfs_server/Active/get_dir", ["FiniteProvide", 3]]]
                }
        ],
        "implementation": [
                [
                        "HTTP-proxy-load-balancer",
                        [["mbs","varnish (= 3.0.2-2.mbs1)"]]
                ],
                [
                        "Wordpress",
                        [["mbs","wordpress (= 3.3.2-3.mbs1)"]]
                ],
                [
                        "MySQL",
                        [["mbs","mysql-MariaDB (= 5.5.23-5.mbs1)"]]
                ],
                [
                        "Nfs_server",
                        [["mbs","nfs-utils (= 1:1.2.5-2.mbs1)"]]
                ]
        ]
}; 
         $scope.objetgestion=[]
        for (var i=0;i<$scope.component["component_types"].length;i++){
          // le maximun de VM = le nombre de service 
          // tab objet temporaire pour objetgestion
          tab      = new Object();
          // exclut objet temporaire contenant la liste des objets qui precise une regle exclusion
          exclut   = new Object();
          // includ  objet temporaire contenant la liste des objets qui ne naicessite pas une regle exclusion
          includ   = new Object();
          //ez     = new Array();
         
//        relation = new Object();
//        operateurlogique   = new Array();
          //tab objet 
          console.info($scope.component["component_types"][i].name)
          tab['name']=$scope.component["component_types"][i].name;
          tab['nb_service'] = 0;
          tab['regle'] = "";
          for (var j=0;j<$scope.component["component_types"].length;j++){
            if($scope.component["component_types"][i].name!=$scope.component["component_types"][j].name){ // on definie 1 regle en premier lieu seulement pour 1 service  
              includ[$scope.component["component_types"][j].name]=1;
             // console.log($scope.component["component_types"][j].name)
            }//end if
          }//end for
          exclut[$scope.component["component_types"][i].name]=1;
          tab['exclut']          = exclut;
          tab['includ']          = includ;
          //tab['ez']           = ez;
          tab['nbinclud']        = $scope.countProperties(tab['includ']);
          //definie matrice de relations logiques entrent les services
          for (var l=0;l<$scope.component["component_types"].length;l++){
            for (var j=0;j<$scope.component["component_types"].length;j++){
              tab[$scope.component["component_types"][l].name+"_"+$scope.component["component_types"][j].name]=1
            }
          }
         $scope.objetgestion[i] = tab;
        }//end for  
                    };//end init
        
        $scope.gestion_operateur=function(servIndex,name){
          //console.log(servIndex+" "+name+" ")
        }
        
        $scope.valide_exclud = function(index){
          if($scope.countProperties($scope.objetgestion[index].exclut)>0) return true;
          return false;
        }
        $scope.valide_choix = function(index){
          if($scope.countProperties($scope.objetgestion[index].includ)>0) return true;
          return false;
        }
        $scope.valide_logique= function(index){
          if($scope.countProperties($scope.objetgestion[index].exclut)>1) 
          {
            return true;
          }
          return false;
        }
        
        $scope.add= function(index,objetsupp,objetgroupe,valobjetgroup){
          $scope.objetgestion[index].includ[objetsupp]=$scope.objetgestion[index].exclut[objetsupp]
          delete $scope.objetgestion[index].exclut[objetsupp]
        }
 
        $scope.supp= function(index,objetsupp,objetgroupe,valobjetgroup){
          $scope.objetgestion[index].exclut[objetsupp]=$scope.objetgestion[index].includ[objetsupp]
          delete $scope.objetgestion[index].includ[objetsupp]
        }
        
        $scope.listeoperation= function(ind){
          er=new Array();
          angular.forEach($scope.objetgestion[ind].exclut, function(objvalue, index){
            er.push(index)
          });
          ez=new Array();
          for(i=0;i< er.length-1;i++){
            var t=new Object();
            t['in']   = er[i]
            t['out']  = er[i+1]
            t['clef'] = er[i]+"_"+er[i+1]
            ez.push(t)
           }
           $scope.ez=ez
           return $scope.ez;
         }
        
        $scope.operateur= function(and,servIndex,a1,a2,a3){
          console.log(servIndex+ and+a1+a2+a3)
          if(and=="and") $scope.objetgestion[servIndex][a3]=1 ;
                              else
                        $scope.objetgestion[servIndex][a3]=0 ;
        }
        
        $scope.recalculeregle=function()
        {
          $scope.regle=""
              angular.forEach($scope.objetgestion, function(objvalue, index){
                objvalue.regle=""
                if(objvalue.nb_service <=0 && $scope.countProperties(objvalue.exclut)>0) 
                  objvalue.regle=" #(_) ";
                else
                  if(objvalue.nb_service!=0)
                  objvalue.regle="(#"+objvalue.name+"="+objvalue.nb_service+") ";
                // priorite des operateurs logique && avant ||
                if($scope.countProperties(objvalue.exclut)>0){
                    objvalue.regle+=" {"+$scope.VM_type+" : "
                    //var valeurdata=""
                    var tableau     =[] //recupere service exclut suivant index
                    var tableauregle=[]//recupere regle  suivant index
                    angular.forEach(objvalue.exclut,function( objexclud,val){
                      tableau.push(val)
                      //console.log(tableau.length)
                      var valeurdata=""
                      tableauregle.push("#"+val+" > "+ objexclud + "")
                     // objvalue.regle+="#"+val+" > " + objexclud + ""
                    });//end forEach
                    // écriture regle avec opérateur logique
                    var valeurdata=""
                    //console.log("taille="+tableau.length)
                    for(i=0;i< tableau.length-1;i++){
                      if(objvalue[tableau[i]+"_"+tableau[i+1]]==1)
                        valeurdata=" and ";
                      else 
                        valeurdata=" or ";
                      objvalue.regle+=tableauregle[i]
                      objvalue.regle+=valeurdata
                    }
                    if(tableau.length > 1)
                        objvalue.regle+=tableauregle[tableau.length-1]
                    else
                      if(tableau.length == 1)
                        objvalue.regle+=tableauregle[0]
                    objvalue.regle+=" } = 0"
                }//end if
                //$scope.regle+=objvalue.regle+"<br>"
                $scope.regle+=objvalue.regle+"\n"
              });//end forEach
        }
        
        $scope.$watch('objetgestion',
            function(val) {
             $scope.recalculeregle()
            },
        true
        );//end $scope.$watch
        $scope.$watch('VM_type',
            function(val) {
              //$scope.$digest();
              $scope.recalculeregle();
            },
        true);//end $scope.$watch
        
        $scope.$watch('regle',
            function(val) {
             console.log("textaera modifie a la main"); 
            },
        true);//end $scope.$watch
  }); //fin definition controleur controleur_contrainte
