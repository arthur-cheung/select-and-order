function SearchAndOrder(node, list, options) {
    // Variables
    var model = list;
    var availableIndices = [];
    var selectedIndices = [];
    var debugOn = false;

    // Functions
    function debug(flag){
        debugOn = !!flag;
        return {model: model, selectedIndices: selectedIndices, availableIndices: availableIndices}
    }
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

    function buildListItems(ul, listItems) {
        !!debugOn && console.info(JSON.stringify(listItems));
        forEach(listItems, function buildListItem(listItem) {
            var li = document.createElement('div'); // It's actually a div
            li.setAttribute('data-value', (typeof listItem === 'string' ? listItem : listItem.value));
            var dataType = 'unknown';
            if (typeof listItem === 'string') {
                dataType = 'string';
            }
            else if (typeof listItem === 'object' && !!listItem.name && !!listItem.value) {
                dataType = 'nvp';
            }
            !!debugOn && console.info(listItem + ': ' + dataType);
            li.className = 'dndListItem';
            li.setAttribute('data-type', dataType);
            li.innerText = (typeof listItem === 'string' ? listItem : listItem.name);
            ul.appendChild(li);
        });
    }

    function buildUnorderedList(node, listItems, options){
        var ul = document.createElement('div'); // It's actually a div
        ul.className = 'dndList' + (!!options && !!options.class ? (' ' + options.class) : '');

        buildListItems(ul, listItems);
        node.appendChild(ul);

        return ul;
    }
    function indexOfItem(list, item){
        var indexToRemove = -1;
        forEach(list, function forEachListItem(listItem, index){
            if(indexToRemove != -1){    // No need to keep searching if we found it already
                return;
            }
            if(typeof item === 'string' && typeof listItem === 'string'){
                if(item == listItem){
                    indexToRemove = index;
                }
            }
            else if((typeof listItem === 'object' && !!listItem.name && !!listItem.value) && (typeof item === 'object' && !!item.name && !!item.value)){
                if(listItem.name == item.name && listItem.value == item.value){
                    indexToRemove = index;
                }
            }
        });

        return indexToRemove;
    }
    function buildInitialAvailbleIndices(){
        forEach(model, function forEachModelItem(item, index){
            availableIndices.push(index);
        });
    }
    function addSelected(item){
        // Find the index of item in model
        var index = indexOfItem(model, item);

        // Add to selectedIndices if it isn't already there
        if(index != -1 && selectedIndices.indexOf(index) == -1){
            selectedIndices.push(index);
        }
        // Remove from availableIndices
        var indexOfAvailable = availableIndices.indexOf(index);
        if(indexOfAvailable != -1){
            availableIndices.splice(indexOfAvailable, 1);
        }
        !!debugOn && console.info('DEBUG => Adding item model[' + index + ']: ' + JSON.stringify(item));
    }
    function removeSelected(item){
        // Find the index of item in model
        var index = indexOfItem(model, item);
        // Remove from selectedIndices if it is there
        var indexOfSelected = selectedIndices.indexOf(index);
        if(indexOfSelected != -1){
            selectedIndices.splice(indexOfSelected, 1);
        }

        // Add to availableIndices, then sort
        if(index != -1 && availableIndices.indexOf(index) == -1){
            availableIndices.push(index);
            availableIndices.sort(function(a, b){return a-b});
        }
        !!debugOn && console.info('DEBUG => Removing item model[' + index + ']: ' + JSON.stringify(item));
    }
    function rebuildSelectedIndices(){
        var targetListItems = node.querySelectorAll('.targetList > div');
        selectedIndices = [];
        forEach(targetListItems, function forEachTargetListItem(node){
            // Get selected item
            var newSelectedItem = '';
            if(node.getAttribute('data-type') == 'nvp'){
                newSelectedItem = {};
                newSelectedItem.value = node.getAttribute('data-value');
                newSelectedItem.name = node.innerText;
            }
            else if(node.getAttribute('data-type') == 'string'){
                newSelectedItem = node.innerText;
            }

            // Find index
            var index = indexOfItem(newSelectedItem);
            selectedIndices.push(index);
        });
    }
    function buildFilteredAvailableList(filter){
        !!debugOn && console.info('Filter: ' + filter);
        if(!filter){    // If not filter supplied, just return full list;
            rebuildAvailableList();
            return;
        }
        // Build the filtered availableModel first
        var filteredList = [];
        forEach(availableIndices, function forEachModelItem(index){
            var item = typeof model[index] === 'string' ? model[index] : (model[index].name || '');
            if(item.indexOf(filter) != -1){
                filteredList.push(item);
            }
        });
        // Then re-build the source list from filtered items;
        var sourceListNode = node.querySelector('.sourceList');
        sourceListNode.innerHTML = '';
        buildListItems(sourceListNode, filteredList);
    }
    function rebuildAvailableList(){
        // We'll do this be removing children and rebuilding from list
        var sourceListNode = node.querySelector('.sourceList');
        sourceListNode.innerHTML = '';
        var availableList = [];
        forEach(availableIndices, function forEachModelItem(index){
            availableList.push(model[index]);
        });
        buildListItems(sourceListNode, availableList);
    }
    function createFilterElement(){
        var filterDiv = document.createElement('div');
        filterDiv.className = 'filterBox';
        var html = '<div class="label">Filter:</div><input type="text"/>';
        filterDiv.innerHTML = html;
        var input = filterDiv.querySelector('input');
        input.onkeyup = function(){
            !!debugOn && console.info('Keyup: ' + this.value);
            buildFilteredAvailableList(this.value);
        };

        return filterDiv;
    }


    // Actual code
    node.className += ' selectAndOrder';
    // Create two child nodes, one for the select list, one for the order list
    var sourceNode = document.createElement('div');
    sourceNode.appendChild(createFilterElement());
    var targetNode = document.createElement('div');
    var id = (!!options && options.id) || (+new Date() + '_dndWidget');

    var sourceUl = buildUnorderedList(sourceNode, list, {class: 'sourceList'});
    var targetUl = buildUnorderedList(targetNode, [], {class: 'targetList'});
    node.appendChild(sourceNode);
    node.appendChild(targetNode);
    buildInitialAvailbleIndices();



    var dndWidget = dragula([sourceUl, targetUl], {
        isContainer: function (el) {
            return false; // only elements in drake.containers will be taken into account
        },
        moves: function (el, source, handle, sibling) {
            return true; // elements are always draggable by default
        },
        accepts: function (el, target, source, sibling) {
            return !(source == sourceUl && target == sourceUl);
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
    dndWidget.on('drop', function(el, target, source){
        // Get drop item
        var dropItem = '';
        if(el.getAttribute('data-type') == 'nvp'){
            dropItem = {};
            dropItem.name = el.innerText;
            dropItem.value = el.getAttribute('data-value');
        }
        else if(el.getAttribute('data-type') == 'string'){
            dropItem = el.innerText;
        }
        // Items from source list can only bit dropped onto target
        // But items from target list can be dropped anywhere
        if(source == sourceUl){
            if(target == sourceUl){
                return false;
            }
            if(target == targetUl){
                addSelected(dropItem);
                return true;
            }
        }
        if(source == targetUl){
            if(target == sourceUl){
                removeSelected(dropItem);

                // Reorder the source list
                rebuildAvailableList();
                return true;
            }
            if(target == targetUl){
                rebuildSelectedIndices();
            }
        }
        return true;
    });
    this.debug = debug;
    this.filter = buildFilteredAvailableList;
}

