/* Products Controller */

mainApp.controller('ProductsCtrl', ['$scope', '$http','Translate','$mdDialog',
  function ($scope, $http, Translate,$mdDialog) {
      
     /* Translation Setup,fill $scope with language words */
      Translate.getTranslation($scope,appConfig.language);
     
     
   /* ------------ Initialize ------------ */
      ProductHelper.init($scope,$http);
      
      $scope.boxList      = [];
      ProductHelper.makeBox(    {id:0}  ); // make root category
      

      
  /* ------------  Event Function  ------------ */
      $scope.itemClick   = function(box,item){
          
          for(var i=0; box.itemList[i]; i++)
              box.itemList[i].selected = false;
          item.selected     = true;
          
          ProductHelper.removeNextBox(box);
          ProductHelper.makeBox(item);

              
          
          
      }
      
      // Sortable/DragDrop Events for Categories
      $scope.sortableOptions = {
            accept: function (sourceItemHandleScope, destSortableScope) {
                return true;
            },
            orderChanged: function(data){  
                var sortedList          = data.dest.sortableScope.modelValue;
                return ProductHelper.sortItems(sortedList);   
            },
            itemMoved: function (data) {
                var movedItem        =   data.source.itemScope.item;
                var box              =   data.dest.sortableScope.$parent.box;
                var sortedList       =   data.dest.sortableScope.modelValue;

                ProductHelper.changeCategoryParent(movedItem.id,box.catid).success(function(data, status, headers, config) {
                    return ProductHelper.sortItems(sortedList);
                }).
                error(function(){alert('Error in changeCategoryParent | product ctrl')})
                
            }
        };
      
      
      
      $scope.addClick   = function(box,event){
          $mdDialog.show(
            $mdDialog.alert()
              .title('This is an alert title')
              .content('You can specify some description text in here.')
              .ariaLabel('Password notification')
              .ok('Got it!')
              .targetEvent(event)
          );
      }
      
      $scope.delete = function(box,item){
         console.log(pos = box.itemList.indexOf(item)); 
         pos > -1 && box.itemList.splice( pos, 1 );
         
      }
      
      

  }]);
  
  
  
  
/**
* ProductHelper object
* the object contains functions work with products 
* its connected to Product Controller
*/
  var ProductHelper = {
    
 /* scope of controller used in view */
    $scope : false,
    
 /* $http of controller used in communication with the remote  */
    $http : false,
    
    
    
    
/*--------------------[ M E T H O D S ]--------------------*/
    
    init:function($scope,$http)
    {
       this.$scope   = $scope;
       this.$http    = $http;
    },
    
    
    
    makeBox:function(item)
    {
        console.log(this.getCatChildrenType(item));
        if(this.getCatChildrenType(item) == 'category')
        {
            var url         = '/product/getCatList';
            var dataType    = 'category';
        }else
        {
            var url         = '/product/getProductList';
            var dataType    = 'product';
        }
        var parentid = item.id;
        
        /* fetch data */
        this.ajax(url,{catid:parentid}).success(function(data, status, headers, config) {
            boxObject   = {
                boxid       : ProductHelper.$scope.boxList.length,
                catid       : parentid,
                itemList    : data,
                type        : dataType,
            };
            ProductHelper.$scope.boxList.push(boxObject);
        }).
        error(function(){alert('Error in fetch data | product ctrl')});
        
    },
    
    
    /**
     * ProductHelper.sortItems()
     *  sort items in each box
     *  this method make an array contains objects of  
     *      `id`        the id of item 
     *      `priority`  the priority of item
     * by given sorted item List as parameter
     * and then sends array to backend to update  sorted list
     * 
     * @param  array itemList :  new sorted item list of one box 
     * @return boolean   
     */
    sortItems:function(itemList)
    {
        var orderList   = {};
        for(i in itemList)
            orderList[i] = {
                id        :itemList[i].id,
                priority  :i
            };
        var params = {
            list     :orderList,
            parentId :itemList[i]['parent_id']
        };
        return this.ajax('/product/sortCategories',params);
    },
    
    
    /**
     * ProductHelper.changeCategoryParent()
     *  change parent id of given category to given new parent id
     * 
     * @param  int      itemId      :  id of category should be update 
     * @param  int      newParentId :  new id of new parent 
     * @param  function callback    :  a function run after 
     * @return object $http angular service, it has success and error callbacks
     *         to achive ajax response   
     */
    changeCategoryParent:function(itemId,newParentId)
    {
        var params = {
            itemId      :itemId,
            newParentId :newParentId
        };
        return this.ajax('/product/changeCategoryParent',params)
    },
    
    
    /**
     * ProductHelper.getCatChildrenType()
     *  return  type of category children
     *  the children could be `product` or `category`
     * 
     * @param  int item
     * @return string   
     */
    getCatChildrenType:function(item)
    {
        if(item['type_id'] && item['type_id'] !="0")
            return 'product';
        return 'category';
    },
    
  
    
    
    /**
     * ProductHelper.removeNextBox()
     *   remove boxes after specific box index
     *   it's used when the item of previous box was clicked , so the next boxes
     *   should be removed
     * 
     * @param object box     
     */
    removeNextBox:function(box)
    {
        var baseBoxIndex    = this.$scope.boxList.indexOf(box);
        this.$scope.boxList = this.$scope.boxList.slice(0,baseBoxIndex+1);
    },
    
    
    
    
    /**
     * ProductHelper.ajax()
     *   function for Post request , it uses $http angular service
     * 
     * @param string url     url of post request
     * @param object params  object of parameters to send 
     * @return object $http angular service, it has success and error callbacks
     *         to achive ajax response
     */
    ajax:function(url,params){
        return this.$http(
        {
            method          : 'POST',
            url             : window.appConfig.urlPrefix+url,
            data            : params,
            /*
             *  NOTE: Because our backend doesnt support Content-Type: application/json,
             *        so we need to transmits data using Content-Type: x-www-form-urlencoded
             *        and the familiar foo=bar&baz=moe serialization.
             *        angular uses application/json
            */
            headers         : {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function(obj) {
                return $.param(obj)
            }
        });
    }
    
  };