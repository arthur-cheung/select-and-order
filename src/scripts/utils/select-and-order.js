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

    function buildListItems(ul, listItems, options) {
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

            // Add add / remove links
            if(!!options && !!options.includeAddRemoveLink){
                var actionLink = document.createElement('span');
                actionLink.className = 'liAction';
                li.appendChild(actionLink);
                actionLink.onclick = function(){
                    var parentUl = li.parentNode;

                    if(!parentUl){
                        console.error('ERROR: No parent found for this link, cannot perform action.');
                        return;
                    }
                    var action = (parentUl.className.indexOf('targetList') != -1) ? 'remove' : 'add';
                    var dropItem = '';
                    if(li.getAttribute('data-type') == 'nvp'){
                        dropItem = {};
                        dropItem.name = li.innerText;
                        dropItem.value = li.getAttribute('data-value');
                    }
                    else if(li.getAttribute('data-type') == 'string'){
                        dropItem = li.innerText;
                    }
                    parentUl.removeChild(li);
                    if(action == 'add'){
                        var targetUl = node.querySelector('.targetList');
                        targetUl.appendChild(li);
                        addSelected(dropItem);
                    }
                    else if(action == 'remove'){
                        removeSelected(dropItem)
                        // Reorder the source list
                        rebuildAvailableList();
                        // Clear the filter input
                        clearFilterInput();
                    }
                }
            }
            ul.appendChild(li);
        });
    }

    function buildUnorderedList(node, listItems, options){
        var ul = document.createElement('div'); // It's actually a div
        ul.className = 'dndList' + (!!options && !!options.class ? (' ' + options.class) : '');

        buildListItems(ul, listItems, options);
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
        availableIndices = [];
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
            if(!model[index]){
                console.error('ERROR: model[' + index + '] is null.');
                return;
            }
            var displayText = typeof model[index] === 'string' ? model[index] : (model[index].name || '');
            if(displayText.indexOf(filter) != -1){
                filteredList.push(model[index]);
            }
        });
        // Then re-build the source list from filtered items;
        var sourceListNode = node.querySelector('.sourceList');
        sourceListNode.innerHTML = '';
        buildListItems(sourceListNode, filteredList, {includeAddRemoveLink: true});
    }
    function rebuildAvailableList(){
        // We'll do this be removing children and rebuilding from list
        var sourceListNode = node.querySelector('.sourceList');
        sourceListNode.innerHTML = '';
        var availableList = [];
        forEach(availableIndices, function forEachModelItem(index){
            availableList.push(model[index]);
        });
        buildListItems(sourceListNode, availableList, {includeAddRemoveLink: true});
    }
    function rebuildSelectedList(){
        // We'll do this be removing children and rebuilding from list
        var targetListNode = node.querySelector('.targetList');
        targetListNode.innerHTML = '';
        var selectedList = [];
        forEach(selectedIndices, function forEachModelItem(index){
            selectedList.push(model[index]);
        });
        buildListItems(targetListNode, selectedList, {includeAddRemoveLink: true});
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

        // Add reset button
        var resetButton = document.createElement('span');
        resetButton.className = 'filterReset';
        resetButton.innerText = 'x';
        resetButton.onclick = function(){
            clearFilterInput();
            buildFilteredAvailableList('');
        };
        filterDiv.appendChild(resetButton);

        return filterDiv;
    }
    function clearFilterInput(){
        var input = node.querySelector('.filterBox input');
        input.value = '';
    }
    function reset(){
        selectedIndices = [];
        rebuildSelectedList();
        buildInitialAvailbleIndices();
        // Reorder the source list
        rebuildAvailableList();
        // Clear the filter input
        clearFilterInput();
    }
    function setSelectedModel(deltaSelected){
        // Reset first
        reset();

        forEach(deltaSelected, function forEachDeltaSelectedItem(deltaItem){
            addSelected(deltaItem);
        });
        rebuildSelectedList();
        rebuildAvailableList();
    }
    function createClearSelectionButton(){
        var button = document.createElement('input');
        button.type = 'button';
        button.value = 'Clear Selection';
        button.className = 'clearButton';
        button.onclick = function(){
            reset();
        };

        return button;
    }
    function getModel(){
        return model;
    }
    function getSelectedModel(){
        var selectedModel = [];
        forEach(selectedIndices, function forSelectedIndex(index){
            selectedModel.push(model[index]);
        });
        return selectedModel;
    }
    function getAvailableModel(){
        var availableModel = [];
        forEach(availableIndices, function forSelectedIndex(index){
            availableModel.push(model[index]);
        });
        return availableModel;
    }


    // Actual code
    node.className += ' selectAndOrder';
    // Create two child nodes, one for the select list, one for the order list
    var sourceNode = document.createElement('div');
    var sourceHeading = document.createElement('h2');
    sourceHeading.innerText = 'Available';
    sourceNode.appendChild(sourceHeading);
    sourceNode.appendChild(createFilterElement());
    var targetNode = document.createElement('div');
    var targetHeading = document.createElement('h2');
    targetHeading.innerText = 'Selected';
    targetNode.appendChild(targetHeading);
    targetNode.appendChild(createClearSelectionButton());
    var id = (!!options && options.id) || (+new Date() + '_dndWidget');

    var sourceUl = buildUnorderedList(sourceNode, list, {class: 'sourceList', includeAddRemoveLink: true});
    var targetUl = buildUnorderedList(targetNode, [], {class: 'targetList', includeAddRemoveLink: true});
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
                // Clear the filter input
                clearFilterInput();
                return true;
            }
            if(target == targetUl){
                rebuildSelectedIndices();
            }
        }
        return true;
    });

    // Public functions
    this.setSelectedModel = setSelectedModel;
    this.reset = reset;
    this.debug = debug;
    this.filterAvailable = buildFilteredAvailableList;
    this.getModel = getModel;
    this.getAvailableModel = getAvailableModel;
    this.getSelectedModel = getSelectedModel;
}

