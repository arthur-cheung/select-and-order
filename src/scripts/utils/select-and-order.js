function SearchAndOrder(node, list, options) {
    function forEach(list, callback) {
        function isNodeList(nodes) {
            var stringRepr = Object.prototype.toString.call(nodes);

            return typeof nodes === 'object' &&
                /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr);
        }

        if (Object.prototype.toString.call(list) === '[object Array]') {
            for (var i = 0; !!list && i < list.length; i++) {
                callback(list[i], i);
            }
        }
        else if (typeof list == 'object') {
            var isNodeList = isNodeList(list);

            for (var i in list) {
                if (!isNodeList || (isNodeList && i != 'length' && i != 'item')) {
                    callback(list[i], i);
                }
            }
        }
    }
    function indexOfItem(list, item){
        for(var i = 0; !!list && i < list.length; i++){
            if(!!item && typeof item === 'string' && !!list[i] && typeof list[i] === 'string' && item == list[i]){
                return i;
            }
            else if(!!item && typeof item === 'object' && !!list[i] && typeof list[i] === 'object' ){
                if(!!item.name && !!item.value && list[i].name == item.name && list[i].value == item.value){
                    return i;
                }
            }
        }
        return -1;
    }

    function buildUnorderedList(node, listItems){
        var ul = document.createElement('div');
        ul.className = 'dndList';

        forEach(listItems, function forEachListItems(listItem){
            var li = document.createElement('div');
            li.innerText = (typeof listItem === 'string' ? listItem : listItem.name);
            ul.appendChild(li);
        });
        node.appendChild(ul);

        return ul;
    }


    // Actual code
    node.className += ' selectAndOrder';
    // Create two child nodes, one for the select list, one for the order list
    var sourceNode = document.createElement('div');
    var targetNode = document.createElement('div');

    var sourceUl = buildUnorderedList(sourceNode, list);
    var targetUl = buildUnorderedList(targetNode);
    node.appendChild(sourceNode);
    node.appendChild(targetNode);

    var selectedItems = [];

    var dndWidget = dragula([sourceUl, targetUl], {
        isContainer: function (el) {
            return false; // only elements in drake.containers will be taken into account
        },
        moves: function (el, source, handle, sibling) {
            return true; // elements are always draggable by default
        },
        accepts: function (el, target, source, sibling) {
            return true; // elements can be dropped in any of the `containers` by default
        },
        invalid: function (el, target) { // don't prevent any drags from initiating by default
            return false;
        },
        direction: 'vertical',         // Y axis is considered when determining where an element would be dropped
        copy: false,                   // elements are moved by default, not copied
        revertOnSpill: false,          // spilling will put the element back where it was dragged from, if this is true
        removeOnSpill: false,          // spilling will `.remove` the element, if this is true
        mirrorContainer: document.body // set the element that gets mirror elements appended
    });
//    dndWidget.on('drop', function(){
//        var listItems = document.querySelectorAll('ul.dndSorter li');
//        selectedItems = [];
//        forEach(listItems, function forEachListItem(listItem, index){
//            var selectedItem;
//            if(listItem.getAttribute('data-type') == 'nvp'){
//                selectedItem = {name: '', value: ''};
//                selectedItem.name = listItem.innerText;
//                selectedItem.value = listItem.getAttribute('data-value');
//            }
//            else{
//                selectedItem = listItem.innerText;
//            }
//            selectedItems.push(selectedItem);
//            listItem.setAttribute('data-index', index);
//        });
//    });
}

