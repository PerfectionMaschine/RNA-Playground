/*
University of Freiburg WS 2017/2018
Chair for Bioinformatics
Supervisor: Martin Raden
Author: Alexander Mattheis
*/

"use strict";

(function () {  // namespace
    // public methods (declaration)
    namespace("postProcessing.inputProcessor",
        InputProcessor, activateInputUpdates, inputUpdatesActivated, linkElements, updateGUI, postEdit);

    // instances
    var inputProcessorInstance;

    /**
     * Does all the post-processing
     * like removing/updating wrong inputs
     * and it defines how different
     * input types behave.
     */
    function InputProcessor() {
        inputProcessorInstance = this;

        // variables
        this.inputUpdatesStarted = false;
        this.avoidFocusOutUpdate = false;

        // public methods (linking)
        this.activateInputUpdates = activateInputUpdates;
        this.inputUpdatesActivated = inputUpdatesActivated;
        this.linkElements = linkElements;
        this.updateGUI = updateGUI;
        this.postEdit = postEdit;
    }

    /**
     * Activates algorithm input updates after changes on the input.
     */
    function activateInputUpdates() {
        inputProcessorInstance.inputUpdatesStarted = true;
    }

    /**
     * Checks if input updates are activated or not.
     * @return {boolean} - "true" if updates are activated.
     */
    function inputUpdatesActivated() {
        return inputProcessorInstance.inputUpdatesStarted;
    }

    /**
     * Linking static elements with a function.
     * @param visualViewmodel - Model which is used for example to highlight cells.
     */
    function linkElements(visualViewmodel) {
        fixBrowserBugs();
        changeDefaultKeyBehaviour();

        var algorithmInput = $("#algorithm_input");
        var functionParameters = algorithmInput.find(".fx_parameter");

        var mainOutput = $("#main_output");
        var calculation = mainOutput.find("#calculation");
        var calculationHorizontal = mainOutput.find("#calculation_horizontal");
        var calculationVertical = mainOutput.find("#calculation_vertical");
        var results = $("#results");

        var selectableEntryClass = ".selectable_entry";

        var tableDownload = $(".table_download");
        var tableVerticalDownload = $(".table_vertical_download");
        var tableHorizontalDownload = $(".table_horizontal_download");

        // 1st
        var functionArguments = {"functionParameters": functionParameters};
        algorithmInput.find(".optimization_type").on("change", functionArguments, negateOptimizationParameters);

        var browserWindow = $(window);

        // 2nd
        functionParameters.on("focusout keypress", removeCriticalNumbers);
        algorithmInput.find(".dna_sequence").on("keyup", removeNonDNABases);

        // 3rd
        functionArguments = {
            "calculationTable": calculation,
            "calculationHorizontalTable": calculationHorizontal,
            "calculationVerticalTable": calculationVertical,
            "resultsTable": results,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel
        };
        results.on("click", selectableEntryClass, functionArguments, selectTableEntry);

        // 4th
        functionArguments = {
            "calculationTable": calculation,
            "calculationHorizontalTable": calculationHorizontal,
            "calculationVerticalTable": calculationVertical,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel,
            "number": 0
        };
        calculationVertical.on("click", selectableEntryClass, functionArguments, selectCell);

        functionArguments = {
            "calculationTable": calculation,
            "calculationHorizontalTable": calculationHorizontal,
            "calculationVerticalTable": calculationVertical,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel,
            "number": 1
        };
        calculation.on("click", selectableEntryClass, functionArguments, selectCell);

        functionArguments = {
            "calculationTable": calculation,
            "calculationHorizontalTable": calculationHorizontal,
            "calculationVerticalTable": calculationVertical,
            "selectableEntryClass": selectableEntryClass,
            "visualViewmodel": visualViewmodel,
            "number": 2
        };
        calculationHorizontal.on("click", selectableEntryClass, functionArguments, selectCell);

        // 5th
        functionArguments = {
            "calculationTable": calculation,
            "calculationHorizontalTable": calculationHorizontal,
            "calculationVerticalTable": calculationVertical,
            "number": 0
        };
        tableVerticalDownload.on("click", functionArguments, visualViewmodel.downloadTable);

        functionArguments = {
            "calculationTable": calculation,
            "calculationHorizontalTable": calculationHorizontal,
            "calculationVerticalTable": calculationVertical,
            "number": 1
        };
        tableDownload.on("click", functionArguments, visualViewmodel.downloadTable);

        functionArguments = {
            "calculationTable": calculation,
            "calculationHorizontalTable": calculationHorizontal,
            "calculationVerticalTable": calculationVertical,
            "number": 2
        };
        tableHorizontalDownload.on("click", functionArguments, visualViewmodel.downloadTable);

        // 6th
        functionArguments = {
            "calculationTable": calculation,
            "calculationHorizontalTable": calculationHorizontal,
            "calculationVerticalTable": calculationVertical
        };
        browserWindow.on("resize", functionArguments, visualViewmodel.redrawAllLines);
    }

    /**
     * Bug fixes for specific browsers or versions of browser.
     */
    function fixBrowserBugs() {
        /*
         BUG-FIX for Firefox:
         Inputs of type "number" doesn't get the focus
         in the Firefox browser if one
         of the up- or down-button of the inputs
         is clicked.

         Detected: Firefox 55.0b3 (32-Bit)
         */
        $(function () {
            $("input[type='number']").on("click", function () {
                $(this).focus();
            });
        });
    }

    /**
     * Redefines what for example should happen
     * when a specific key is pressed or on a specific action like pasting.
     */
    function changeDefaultKeyBehaviour() {
        var input = $("input");
        /*
         If "Enter" is pressed the UI should't update immediately.
         The time after which the UI is updated is specified
         with the global default "REUPDATE_TIMEOUT_MS".
         */
        input.keypress(function (e) {
            // Hint: Better would be a tabulator behaviour,
            // but the implementation of that is too complex.
            if (e.which === KEY_CODES.ENTER)
                e.preventDefault();
        });
    }

    /**
     * Negates the function parameters of an algorithm to avoid
     * critically long run-times.
     * Hint: The input has to be of class "optimization_type".
     * @param e - Stores data relevant to the event called that function.
     */
    function negateOptimizationParameters(e) {
        var functionParameters = e.data.functionParameters;

        for (var i = 0; i < functionParameters.length; i++)
            functionParameters[i].value = -functionParameters[i].value;
    }

    /**
     * Removes values from an input-field
     * which can lead to critically long run-times.
     * It is especially used for the function parameters of an algorithm.
     * Hint: The input has to be of class "fx_parameter".
     * @param e - Stores data relevant to the event called that function.
     */
    function removeCriticalNumbers(e) {
        if (e.which === KEY_CODES.ENTER || e.type === "focusout") {
            if ($("#similarity").is(":checked")) {
                if (this.id === "match") {
                    this.value = this.value >= INPUT.ABS_MIN_MATCH ? this.value : INPUT.ABS_MIN_MATCH;
                    this.value = this.value <= INPUT.ABS_MAX ? this.value : INPUT.ABS_MAX;
                }
                else {
                    this.value = this.value <= -INPUT.ABS_MIN ? this.value : -INPUT.ABS_MIN;
                    this.value = this.value >= -INPUT.ABS_MAX ? this.value : -INPUT.ABS_MAX;
                }
            } else {  // distance is checked
                if (this.id === "match") {
                    this.value = this.value <= -INPUT.ABS_MIN_MATCH ? this.value : -INPUT.ABS_MIN_MATCH;
                    this.value = this.value >= -INPUT.ABS_MAX ? this.value : -INPUT.ABS_MAX;
                }
                else {
                    this.value = this.value >= INPUT.ABS_MIN ? this.value : INPUT.ABS_MIN;
                    this.value = this.value <= INPUT.ABS_MAX ? this.value : INPUT.ABS_MAX;
                }
            }
        }
    }

    /**
     * Removes characters from an input-field which are not DNA-bases.
     * Hint: The input has to be of class "dna_sequence".
     */
    function removeNonDNABases() {
        if (!DNA.BASES.test(this.value))
            this.value = this.value.replace(DNA.NON_BASES, SYMBOLS.EMPTY);
    }

    /**
     * Selects a table entry and triggers a function of the visualizer to highlight the entry.
     * @param e - Stores data relevant to the event called that function.
     */
    function selectTableEntry(e) {
        var calculationVerticalTable;
        var calculationTable = e.data.calculationTable[0];
        var calculationHorizontalTable;

        if (e.data.calculationVerticalTable !== undefined) {
            calculationVerticalTable = e.data.calculationVerticalTable[0];
            calculationHorizontalTable = e.data.calculationHorizontalTable[0];
        }

        var resultsTable = e.data.resultsTable;
        var selectableEntries = resultsTable.find(e.data.selectableEntryClass);
        var visualViewmodel = e.data.visualViewmodel;

        var selectedRow = -1;

        for (var i = 0; i < selectableEntries.length; i++) {
            if (this === selectableEntries[i])
                selectedRow = i;
        }

        setTimeout(function () {
            visualViewmodel.highlight(selectedRow, resultsTable[0]);
            visualViewmodel.showTraceback(selectedRow, calculationVerticalTable, calculationTable, calculationHorizontalTable);
        }, REACTION_TIME_HIGHLIGHT);
    }

    /**
     * Highlights a table cell and its neighbours by the help of a visualizer function
     * which shows the neighbours that were needed to compute its cell value.
     * @param e - Stores data relevant to the event called that function.
     */
    function selectCell(e) {
        debugger;
        var number = e.data.number;
        var calculationVerticalTable;
        var calculationTable = e.data.calculationTable;
        var calculationHorizontalTable;

        if (e.data.calculationVerticalTable !== undefined) {
            calculationVerticalTable = e.data.calculationVerticalTable;
            calculationHorizontalTable = e.data.calculationHorizontalTable;
        }

        var currentSelectedTable;
        var label;

        if (number === 0) {
            currentSelectedTable = calculationVerticalTable;
            label = MATRICES.VERTICAL;
        }
        else if (number === 1) {
            currentSelectedTable = calculationTable;
            label = MATRICES.DEFAULT;
        }
        else {  // if (number === 2)
            currentSelectedTable = calculationHorizontalTable;
            label = MATRICES.HORIZONTAL;
        }

        var selectableEntryClass = e.data.selectableEntryClass;
        var selectableEntries = currentSelectedTable.find(selectableEntryClass);
        var visualViewmodel = e.data.visualViewmodel;

        var selectedColumn = -1;
        var selectedRow = -1;

        var tableHeight = currentSelectedTable[0].rows.length - 1;
        var tableWidth = currentSelectedTable[0].rows[0].cells.length - 1;

        for (var i = 0; i < tableHeight; i++) {
            for (var j = 0; j < tableWidth; j++) {

                if (selectableEntries[i * tableWidth + j] === this) {
                    selectedColumn = j;
                    selectedRow = i;
                }
            }
        }

        var cellCoordinates = new procedures.backtracking.Vector(selectedRow, selectedColumn);
        cellCoordinates.label = label;

        setTimeout(function () {
            visualViewmodel.showFlow(cellCoordinates,
                calculationVerticalTable[0], calculationTable[0], calculationHorizontalTable[0]);
        }, REACTION_TIME_HIGHLIGHT);
    }

    /**
     * Updates the user interfaces of the loaded page.
     * @param algorithm - Algorithm used to update the user interface.
     * @param viewmodels - The viewmodels used to access visualization functions.
     * @param processInput - Function from the algorithm which should process the input.
     * @param changeOutput - Function from the algorithm which should change the output after processing the input.
     */
    function updateGUI(algorithm, viewmodels, processInput, changeOutput) {
        var inputs = $("#algorithm_input").find("input");

        inputs.on({
            click: function (e) {
                if ($(this).is(":radio"))
                    updateAfterTimeout(algorithm, viewmodels, processInput, changeOutput);
            },

            focusout: function (e) {
                if (!inputProcessorInstance.avoidFocusOutUpdate) {
                    // Important: if "alert" is used in this function then it will fire this event forever in Chrome
                    // because the alert-box gets the focus and loses it when you click on "OK"
                    // Solution: use "console.log(..)"
                    if (!$(this).is(":radio"))  // a radio button should only fire on a click or you get bugs!
                        updateAfterTimeout(algorithm, viewmodels, processInput, changeOutput);
                }
                inputProcessorInstance.avoidFocusOutUpdate = false;
            },

            keypress: function (e) {
                if (e.which === KEY_CODES.ENTER)
                    updateAfterTimeout(algorithm, viewmodels, processInput, changeOutput);
            },

            mousedown: function (e) {
                if (this.className === "fx_parameter"
                    && this !== document.activeElement
                    && document.activeElement !== document.body)
                    inputProcessorInstance.avoidFocusOutUpdate = true;
                else
                    inputProcessorInstance.avoidFocusOutUpdate = false;
                postProcess();
            }
        });
    }

    function postProcess() {
        removeWrongCharacters();
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);  // reinterpret new LaTeX code
    }

    /**
     * Removes characters from an input-field which are not DNA-bases.
     */
    function removeWrongCharacters() {
        var textElements = $(".dna_sequence");

        for (var i = 0; i < textElements.length; i++)
            textElements[i].value = textElements[i].value.replace(DNA.NON_BASES, SYMBOLS.EMPTY);
    }

    /**
     * Processes inputs to update outputs.
     * @param algorithm - Algorithm used to update the user interface.
     * @param viewmodels - The viewmodel used to access visualization functions and input.
     * @param processInput - Function from the algorithm which should process the input.
     * @param changeOutput - Function from the algorithm which should change the output after processing the input.
     */
    function updateAfterTimeout(algorithm, viewmodels, processInput, changeOutput) {
        setTimeout(function () {  // to avoid using not updated values
            processInput(algorithm, inputProcessorInstance, viewmodels.input, viewmodels.visual);
            changeOutput(algorithm.getOutput(), inputProcessorInstance, viewmodels);
            postProcess();
        }, REUPDATE_TIMEOUT_MS);
    }

    /**
     * Replace "infinity"-strings with the real infinity symbol.
     */
    function postEdit(matrix, visualViewmodel) {
        return visualViewmodel.replaceInfinityStrings(matrix);
    }
}());