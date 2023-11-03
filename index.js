class Interpreter {
    constructor() {
        this.vars = {};
    }
    static tokenize(program) {
        const regex =
            /\s*([-+*\/\%=\(\)]|[A-Za-z_][A-Za-z0-9_]*|[0-9]*\.?[0-9]+)\s*/g;
        return program.split(regex).filter((s) => /\S/.test(s));
    }
    input(expr) {
        let tokens = Interpreter.tokenize(expr);
        if (!tokens.length) return "";
        let newExp = "";
        tokens = this.vars[tokens] ? this.vars[tokens].split("") : tokens;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === "(" || tokens[i] === ")") {
                newExp += tokens[i];
                continue;
            }
            if (!Number(tokens[i]) && tokens[i] !== "=") {
                if (tokens.includes("=")) {
                    this.vars[`${tokens[i]}`] = tokens
                        .slice(tokens.indexOf("=") + 1)
                        .join("");
                    const newVar = this.vars[`${tokens[i]}`];
                    for (let j = 0; j < newVar.length; j++) {
                        if (this.vars[`${newVar[j]}`]) {
                            newExp += this.vars[`${newVar[j]}`];
                        } else {
                            newExp += newVar[j];
                        }
                    }
                    break;
                } else {
                    if (this.vars[`${tokens[i]}`]) {
                        newExp += this.vars[`${tokens[i]}`];
                    } else if (
                        tokens[i] !== "+" &&
                        tokens[i] !== "-" &&
                        tokens[i] !== "/" &&
                        tokens[i] !== "%" &&
                        tokens[i] !== "*"
                    ) {
                        throw Error("Nope");
                    } else {
                        newExp += tokens[i];
                    }
                }
            } else if (Number(tokens[i])) {
                newExp += tokens[i];
            }
        }
        return this.calc(newExp);
    }

    /* THE EVAL FUNCTION IMPLEMENTATION */
    calc(exp) {
        let expressionNoSpace = exp.replaceAll(" ", "");
        for (let i = 0; i < expressionNoSpace.length; i++) {
            const lastIndexOfOpen = expressionNoSpace.lastIndexOf("(");
            let firstIndexOfClose;
            for (let j = lastIndexOfOpen; j < expressionNoSpace.length; j++) {
                if (expressionNoSpace[j] === ")") {
                    firstIndexOfClose = j;
                    break;
                }
            }
            const expressionBetween = expressionNoSpace.slice(
                lastIndexOfOpen,
                firstIndexOfClose + 1
            );
            const expressionBetweenEval = this.evalExpNoBracket(
                expressionBetween.slice(1, expressionBetween.length - 1)
            );
            expressionNoSpace = expressionNoSpace.replace(
                expressionBetween,
                expressionBetweenEval
            );
            if (lastIndexOfOpen === -1 || !firstIndexOfClose) {
                break;
            }
        }
        return this.evalExpNoBracket(expressionNoSpace);
    }
    removeDuplOperator(exp) {
        for (let i = 0; i < exp.length; i++) {
            if (exp[i] === "-" && exp[i + 1] === "-") {
                exp = exp.replaceAll("--", "+");
                i = 0;
            } else if (
                (exp[i] === "+" && exp[i + 1] === "-") ||
                (exp[i] === "-" && exp[i + 1] === "+")
            ) {
                exp = exp.replaceAll("-+", "-");
                exp = exp.replaceAll("+-", "-");
                i = 0;
            } else if (exp[i] === "+" && exp[i + 1] === "+") {
                exp = exp.replaceAll("++", "+");
                i = 0;
            }
        }
        return exp;
    }
    evalExpNoBracket(exp) {
        if (Number(exp)) {
            return Number(exp);
        }
        exp = this.removeDuplOperator(exp);
        const divIndex = exp.lastIndexOf("/");
        const multIndex = exp.lastIndexOf("*");
        const addIndex = exp.lastIndexOf("+");
        const subIndex = exp.lastIndexOf("-");
        const modIndex = exp.lastIndexOf("%");
        if (modIndex !== -1) {
            exp = this.opLogic(exp, modIndex, "%");
            return this.evalExpNoBracket(exp);
        }
        if (multIndex < divIndex) {
            if (multIndex !== -1) {
                exp = this.opLogic(exp, multIndex, "*");
                return this.evalExpNoBracket(exp);
            }
            if (divIndex !== -1) {
                exp = this.opLogic(exp, divIndex, "/");
                return this.evalExpNoBracket(exp);
            }
        } else {
            if (divIndex !== -1) {
                exp = this.opLogic(exp, divIndex, "/");
                return this.evalExpNoBracket(exp);
            }
            if (multIndex !== -1) {
                exp = this.opLogic(exp, multIndex, "*");
                return this.evalExpNoBracket(exp);
            }
        }

        if (addIndex !== -1) {
            exp = this.opLogic(exp, addIndex, "+");
            return this.evalExpNoBracket(exp);
        }
        if (subIndex !== -1) {
            exp = this.opLogic(exp, subIndex, "-");
            return this.evalExpNoBracket(exp);
        }
        return 0;
    }
    opLogic(exp, multIndex, operator) {
        const firstValue = this.getFirst(exp, multIndex);
        const lastValue = this.getLast(exp, multIndex);
        let value;
        if (operator === "/") {
            value = Number(firstValue.value) / Number(lastValue.value);
        } else if (operator === "*") {
            value = Number(firstValue.value) * Number(lastValue.value);
        } else if (operator === "%") {
            value = Number(firstValue.value) % Number(lastValue.value);
        } else if (operator === "+") {
            value = Number(firstValue.value) + Number(lastValue.value);
        } else if (operator === "-") {
            value = Number(firstValue.value) - Number(lastValue.value);
        }
        const valueToReplace = exp.slice(
            firstValue.indexValue,
            lastValue.indexValue
        );
        if (value > 0) {
            if (firstValue.indexValue === 0) {
                value = value;
            } else if (valueToReplace[0] === "/") {
                value = "/" + value;
            } else {
                value = "+" + value;
            }
        }
        exp = exp.replaceAll(valueToReplace, value);
        return exp;
    }
    getFirst(exp, index) {
        let indexValue = index - 1;
        let value = exp[indexValue];
        while (true) {
            indexValue--;
            if (exp[indexValue] === "-") value += "-";
            if (
                exp[indexValue] !== "." &&
                !Number(exp[indexValue]) &&
                exp[indexValue] !== "0"
            )
                break;
            value += exp[indexValue];
        }
        if (!value) {
            return {
                value: 0,
                indexValue,
            };
        }
        if (indexValue === -1) {
            indexValue++;
        }
        value = value.split("").reverse().join("");
        return {
            value,
            indexValue,
        };
    }
    getLast(exp, index) {
        let indexValue = index + 1;
        let value = exp[indexValue];
        while (true) {
            indexValue++;
            if (
                exp[indexValue] !== "." &&
                !Number(exp[indexValue]) &&
                exp[indexValue] !== "0"
            )
                break;
            value += exp[indexValue];
        }
        if (exp[indexValue] === "0" || Number(exp[indexValue])) {
            indexValue++;
        }
        return {
            value,
            indexValue,
        };
    }
}
