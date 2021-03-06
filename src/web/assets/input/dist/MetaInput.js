(function ($) {
    /** global: Craft */
    /** global: Garnish */
    /**
     * Meta input class
     */
    Craft.MetaInput = Garnish.Base.extend(
        {
            id: null,
            inputFields: null,
            inputNamePrefix: null,
            inputIdPrefix: null,
            maxElements: null,
            minElements: null,

            $container: null,
            $elementContainer: null,
            $addElementBtnContainer: null,
            $addElementMenuBtn: null,

            elementSort: null,
            elementSelect: null,
            totalNewElements: 0,

            init: function (id, inputFields, inputNamePrefix, min, max) {
                this.id = id;
                this.inputFields = inputFields;
                this.inputNamePrefix = inputNamePrefix;
                this.inputIdPrefix = Craft.formatInputId(this.inputNamePrefix);
                this.maxElements = max;
                this.minElements = min;

                this.$container = $('#' + this.id);
                this.$elementContainer = this.$container.children('.elements');
                this.$addElementBtnContainer = this.$container.children('.buttons');
                this.$addElementMenuBtn = this.$addElementBtnContainer.children('.btn');

                var $elements = this.$elementContainer.children(),
                    collapsedElements = Craft.MetaInput.getCollapsedElementIds();

                this.elementSort = new Garnish.DragSort($elements, {
                    handle: '> .actions > .move',
                    axis: 'y',
                    filter: $.proxy(function () {
                        // Only return all the selected items if the target item is selected
                        if (this.elementSort.$targetItem.hasClass('sel')) {
                            return this.elementSelect.getSelectedItems();
                        } else {
                            return this.elementSort.$targetItem;
                        }
                    }, this),
                collapseDraggees: true,
                magnetStrength: 4,
                helperLagBase: 1.5,
                helperOpacity: 0.9,
                onSortChange: $.proxy(function () {
                    this.elementSelect.resetItemOrder();
                }, this)
                });

                this.elementSelect = new Garnish.Select(this.$elementContainer, $elements, {
                    multi: true,
                    vertical: true,
                    handle: '> .checkbox, > .titlebar',
                    checkboxMode: true
                });

                for (var i = 0; i < $elements.length; i++) {
                    var $element = $($elements[i]),
                        id = $element.data('id');

                    // Is this a new element?
                    var newMatch = (typeof id == 'string' && id.match(/new(\d+)/));

                    if (newMatch && newMatch[1] > this.totalNewElements) {
                        this.totalNewElements = parseInt(newMatch[1]);
                    }

                    var element = new Meta(this, $element);

                    if (element.id && $.inArray('' + element.id, collapsedElements) != -1) {
                        element.collapse();
                    }
                }

                this.addListener(this.$addElementMenuBtn, 'click', function (ev) {
                    this.addElement();
                });

                this.updateAddElementBtn();

            },

            canAddMoreElements: function () {
                return (!this.maxElements || this.$elementContainer.children().length < this.maxElements);
            },

            updateAddElementBtn: function () {
                if (this.canAddMoreElements()) {
                    // this.$addElementBtnGroup.removeClass('disabled');
                    this.$addElementMenuBtn.removeClass('disabled');

                    for (var i = 0; i < this.elementSelect.$items.length; i++) {
                        var element = this.elementSelect.$items.eq(i).data('element');

                        if (element) {
                            element.$actionMenu.find('a[data-action=add]').parent().removeClass('disabled');
                        }
                    }
                } else {
                    // this.$addElementBtnGroup.addClass('disabled');
                    this.$addElementMenuBtn.addClass('disabled');

                    for (var i = 0; i < this.elementSelect.$items.length; i++) {
                        var element = this.elementSelect.$items.eq(i).data('element');

                        if (element) {
                            element.$actionMenu.find('a[data-action=add]').parent().addClass('disabled');
                        }
                    }
                }
            },

            addElement: function ($insertBefore) {
                if (!this.canAddMoreElements()) {
                    return;
                }

                this.totalNewElements++;

                var id = 'new' + this.totalNewElements;

                var html =
                    '<div class="matrixblock" data-id="' + id + '">' +
                    // '<input type="hidden" name="' + this.inputNamePrefix + '[' + id + '][type]" value="' + type + '"/>' +
                    '<input type="hidden" name="' + this.inputNamePrefix + '[' + id + '][enabled]" value="1"/>' +
                    '<div class="titlebar">' +
                    '<div class="preview"></div>' +
                    '</div>' +
                    '<div class="checkbox" title="' + Craft.t('app', 'Select') + '"></div>' +
                    '<div class="actions">' +
                    '<div class="status off" title="' + Craft.t('app', 'Disabled') + '"></div>' +
                    '<a class="settings icon menubtn" title="' + Craft.t('app', 'Actions') + '" role="button"></a> ' +
                    '<div class="menu">' +
                    '<ul class="padded">' +
                    '<li><a data-icon="collapse" data-action="collapse">' + Craft.t('app', 'Collapse') + '</a></li>' +
                    '<li class="hidden"><a data-icon="expand" data-action="expand">' + Craft.t('app', 'Expand') + '</a></li>' +
                    '<li><a data-icon="disabled" data-action="disable">' + Craft.t('app', 'Disable') + '</a></li>' +
                    '<li class="hidden"><a data-icon="enabled" data-action="enable">' + Craft.t('app', 'Enable') + '</a></li>' +
                    '</ul>' +
                    '<hr class="padded"/>' +
                    '<ul class="padded">' +
                    '<li><a data-icon="plus" data-action="add">' + Craft.t('app', 'Add new above') + '</a></li>' +
                    '</ul>' +
                    '<hr class="padded"/>' +
                    '<ul class="padded">' +
                    '<li><a data-icon="remove" data-action="delete">' + Craft.t('app', 'Delete') + '</a></li>' +
                    '</ul>' +
                    '</div>' +
                    '<a class="move icon" title="' + Craft.t('app', 'Reorder') + '" role="button"></a> ' +
                    '</div>' +
                    '</div>';

                var $element = $(html);

                if ($insertBefore) {
                    $element.insertBefore($insertBefore);
                } else {
                    $element.appendTo(this.$elementContainer);
                }

                var $fieldsContainer = $('<div class="fields"/>').appendTo($element),
                    bodyHtml = this.getParsedElementHtml(this.inputFields.bodyHtml, id),
                    footHtml = this.getParsedElementHtml(this.inputFields.footHtml, id);

                $(bodyHtml).appendTo($fieldsContainer);

                // Animate the element into position
                $element.css(this.getHiddenElementCss($element)).velocity({
                    opacity: 1,
                    'margin-bottom': 10
                }, 'fast', $.proxy(function () {
                    $element.css('margin-bottom', '');
                    Garnish.$bod.append(footHtml);
                    Craft.initUiElements($fieldsContainer);
                    new Meta(this, $element);
                    this.elementSort.addItems($element);
                    this.elementSelect.addItems($element);
                    this.updateAddElementBtn();

                    Garnish.requestAnimationFrame(function () {
                        // Scroll to the element
                        Garnish.scrollContainerToElement($element);
                    });
                }, this));
            },

            collapseSelectedElements: function () {
                this.callOnSelectedElements('collapse');
            },

            expandSelectedElements: function () {
                this.callOnSelectedElements('expand');
            },

            disableSelectedElements: function () {
                this.callOnSelectedElements('disable');
            },

            enableSelectedElements: function () {
                this.callOnSelectedElements('enable');
            },

            deleteSelectedElements: function () {
                this.callOnSelectedElements('selfDestruct');
            },

            callOnSelectedElements: function (fn) {
                for (var i = 0; i < this.elementSelect.$selectedItems.length; i++) {
                    this.elementSelect.$selectedItems.eq(i).data('element')[fn]();
                }
            },

            getHiddenElementCss: function ($element) {
                return {
                    opacity: 0,
                    marginBottom: -($element.outerHeight())
                };
            },

            getParsedElementHtml: function (html, id) {
                if (typeof html == 'string') {
                    return html.replace(/__META__/g, id);
                } else {
                    return '';
                }
            }
        },
        {
            collapsedElementStorageKey: 'Craft-' + Craft.systemUid + '.MetaInput.collapsedElements',

            getCollapsedElementIds: function () {
                if (typeof localStorage[Craft.MetaInput.collapsedElementStorageKey] == 'string') {
                    return Craft.filterArray(localStorage[Craft.MetaInput.collapsedElementStorageKey].split(','));
                } else {
                    return [];
                }
            },

            setCollapsedElementIds: function (ids) {
                localStorage[Craft.MetaInput.collapsedElementStorageKey] = ids.join(',');
            },

            rememberCollapsedElementId: function (id) {
                if (typeof Storage !== 'undefined') {
                    var collapsedElements = Craft.MetaInput.getCollapsedElementIds();

                    if ($.inArray('' + id, collapsedElements) == -1) {
                        collapsedElements.push(id);
                        Craft.MetaInput.setCollapsedElementIds(collapsedElements);
                    }
                }
            },

            forgetCollapsedElementId: function (id) {
                if (typeof Storage !== 'undefined') {
                    var collapsedElements = Craft.MetaInput.getCollapsedElementIds(),
                        collapsedElementsIndex = $.inArray('' + id, collapsedElements);

                    if (collapsedElementsIndex != -1) {
                        collapsedElements.splice(collapsedElementsIndex, 1);
                        Craft.MetaInput.setCollapsedElementIds(collapsedElements);
                    }
                }
            }
        }
    );


    var Meta = Garnish.Base.extend(
        {
            meta: null,
            $container: null,
            $titlebar: null,
            $fieldsContainer: null,
            $previewContainer: null,
            $actionMenu: null,
            $collapsedInput: null,

            isNew: null,
            id: null,

            collapsed: false,

            init: function (meta, $container) {
                this.meta = meta;
                this.$container = $container;
                this.$titlebar = $container.children('.titlebar');
                this.$previewContainer = this.$titlebar.children('.preview');
                this.$fieldsContainer = $container.children('.fields');

                this.$container.data('element', this);

                this.id = this.$container.data('id');
                this.isNew = (!this.id || (typeof this.id == 'string' && this.id.substr(0, 3) == 'new'));

                var $menuBtn = this.$container.find('> .actions > .settings'),
                    menuBtn = new Garnish.MenuBtn($menuBtn);

                this.$actionMenu = menuBtn.menu.$container;

                menuBtn.menu.settings.onOptionSelect = $.proxy(this, 'onMenuOptionSelect');

                // Was this element already collapsed?
                if (Garnish.hasAttr(this.$container, 'data-collapsed')) {
                    this.collapse();
                }

                this._handleTitleBarClick = function (ev) {
                    ev.preventDefault();
                    this.toggle();
                };

                this.addListener(this.$titlebar, 'doubletap', this._handleTitleBarClick);
            },

            toggle: function () {
                if (this.collapsed) {
                    this.expand();
                } else {
                    this.collapse(true);
                }
            },

            collapse: function (animate) {
                if (this.collapsed) {
                    return;
                }

                this.$container.addClass('collapsed');

                var previewHtml = '',
                    $fields = this.$fieldsContainer.children();

                for (var i = 0; i < $fields.length; i++) {
                    var $field = $($fields[i]),
                        $inputs = $field.children('.input').find('select,input[type!="hidden"],textarea,.label'),
                        inputPreviewText = '';

                    for (var j = 0; j < $inputs.length; j++) {
                        var $input = $($inputs[j]),
                            value;

                        if ($input.hasClass('label')) {
                            var $maybeLightswitchContainer = $input.parent().parent();

                            if ($maybeLightswitchContainer.hasClass('lightswitch') && (
                                    ($maybeLightswitchContainer.hasClass('on') && $input.hasClass('off')) ||
                                    (!$maybeLightswitchContainer.hasClass('on') && $input.hasClass('on'))
                                )) {
                                continue;
                            }

                            value = $input.text();
                        } else {
                            value = Craft.getText(Garnish.getInputPostVal($input));
                        }

                        if (value instanceof Array) {
                            value = value.join(', ');
                        }

                        if (value) {
                            value = Craft.trim(value);

                            if (value) {
                                if (inputPreviewText) {
                                    inputPreviewText += ', ';
                                }

                                inputPreviewText += value;
                            }
                        }
                    }

                    if (inputPreviewText) {
                        previewHtml += (previewHtml ? ' <span>|</span> ' : '') + inputPreviewText;
                    }
                }

                this.$previewContainer.html(previewHtml);

                this.$fieldsContainer.velocity('stop');
                this.$container.velocity('stop');

                if (animate) {
                    this.$fieldsContainer.velocity('fadeOut', {duration: 'fast'});
                    this.$container.velocity({height: 16}, 'fast');
                } else {
                    this.$previewContainer.show();
                    this.$fieldsContainer.hide();
                    this.$container.css({height: 16});
                }

                setTimeout($.proxy(function () {
                    this.$actionMenu.find('a[data-action=collapse]:first').parent().addClass('hidden');
                    this.$actionMenu.find('a[data-action=expand]:first').parent().removeClass('hidden');
                }, this), 200);

                // Remember that?
                if (!this.isNew) {
                    Craft.MetaInput.rememberCollapsedElementId(this.id);
                } else {
                    if (!this.$collapsedInput) {
                        this.$collapsedInput = $('<input type="hidden" name="' + this.meta.inputNamePrefix + '[' + this.id + '][collapsed]" value="1"/>').appendTo(this.$container);
                    } else {
                        this.$collapsedInput.val('1');
                    }
                }

                this.collapsed = true;
            },

            expand: function () {
                if (!this.collapsed) {
                    return;
                }

                this.$container.removeClass('collapsed');

                this.$fieldsContainer.velocity('stop');
                this.$container.velocity('stop');

                var collapsedContainerHeight = this.$container.height();
                this.$container.height('auto');
                this.$fieldsContainer.show();
                var expandedContainerHeight = this.$container.height();
                this.$container.height(collapsedContainerHeight);
                this.$fieldsContainer.hide().velocity('fadeIn', {duration: 'fast'});
                this.$container.velocity({height: expandedContainerHeight}, 'fast', $.proxy(function () {
                    this.$previewContainer.html('');
                    this.$container.height('auto');
                }, this));

                setTimeout($.proxy(function () {
                    this.$actionMenu.find('a[data-action=collapse]:first').parent().removeClass('hidden');
                    this.$actionMenu.find('a[data-action=expand]:first').parent().addClass('hidden');
                }, this), 200);

                // Remember that?
                if (!this.isNew && typeof Storage !== 'undefined') {
                    var collapsedElements = Craft.MetaInput.getCollapsedElementIds(),
                        collapsedElementsIndex = $.inArray('' + this.id, collapsedElements);

                    if (collapsedElementsIndex != -1) {
                        collapsedElements.splice(collapsedElementsIndex, 1);
                        Craft.MetaInput.setCollapsedElementIds(collapsedElements);
                    }
                }

                if (!this.isNew) {
                    Craft.MetaInput.forgetCollapsedElementId(this.id);
                } else if (this.$collapsedInput) {
                    this.$collapsedInput.val('');
                }

                this.collapsed = false;
            },

            disable: function () {
                this.$container.children('input[name$="[enabled]"]:first').val('');
                this.$container.addClass('disabled');

                setTimeout($.proxy(function () {
                    this.$actionMenu.find('a[data-action=disable]:first').parent().addClass('hidden');
                    this.$actionMenu.find('a[data-action=enable]:first').parent().removeClass('hidden');
                }, this), 200);

                this.collapse(true);
            },

            enable: function () {
                this.$container.children('input[name$="[enabled]"]:first').val('1');
                this.$container.removeClass('disabled');

                setTimeout($.proxy(function () {
                    this.$actionMenu.find('a[data-action=disable]:first').parent().removeClass('hidden');
                    this.$actionMenu.find('a[data-action=enable]:first').parent().addClass('hidden');
                }, this), 200);
            },

            onMenuOptionSelect: function (option) {
                var batchAction = (this.meta.elementSelect.totalSelected > 1 && this.meta.elementSelect.isSelected(this.$container)),
                    $option = $(option);

                switch ($option.data('action')) {
                    case 'collapse': {
                        if (batchAction) {
                            this.meta.collapseSelectedElements();
                        } else {
                            this.collapse(true);
                        }

                        break;
                    }

                    case 'expand': {
                        if (batchAction) {
                            this.meta.expandSelectedElements();
                        } else {
                            this.expand();
                        }

                        break;
                    }

                    case 'disable': {
                        if (batchAction) {
                            this.meta.disableSelectedElements();
                        } else {
                            this.disable();
                        }

                        break;
                    }

                    case 'enable': {
                        if (batchAction) {
                            this.meta.enableSelectedElements();
                        } else {
                            this.enable();
                            this.expand();
                        }

                        break;
                    }

                    case 'add': {
                        // var type = $option.data('type');
                        this.meta.addElement(this.$container);
                        break;
                    }

                    case 'delete': {
                        if (batchAction) {
                            if (confirm(Craft.t('app', 'Are you sure you want to delete the selected elements?'))) {
                                this.meta.deleteSelectedElements();
                            }
                        } else {
                            this.selfDestruct();
                        }

                        break;
                    }
                }
            },

            selfDestruct: function () {
                this.$container.velocity(this.meta.getHiddenElementCss(this.$container), 'fast', $.proxy(function () {
                    this.$container.remove();
                    this.meta.updateAddElementBtn();
                }, this));
            }
        }
    );
})(jQuery);
