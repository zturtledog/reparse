//@author: confusedParrotFish/zturtledog
//@permissions: no redistribution without credit

export const lex = (code, rules) => {
    const rule = parserules(rules)
    const lines = tokenlines(code, rule)
    const lexed = (rules.linecount ?
        countlines(lines, rule) : lines)
    const dblk = (rules.dblock ? rules.dblock(lexed, rules) : lexed)
    return dblk
}
function mixlist(a, b) {
    for (let i = 0; i < b.length; i++) {
        a.push(b[i]);
    }
    return a;
}
function countlines(sta, r) {
    let nl = 1;
    let col = 0;
    for (let i = 0; i < sta.length; i++) {
        if (r.linecount.includes(sta[i].type)) {
            nl++;
            col = -1;
        }
        sta[i].line = nl;
        sta[i].col = col;
        col += sta[i].value.length;
    }
    return sta;
}
function parserules(r) {
    const nmatch = [];
    for (let i = 0; i < r.match.length; i++) {
        if (r.match[i].length > 1) {
            if (Array.isArray(r.match[i][1])) {
                for (let j = 0; j < r.match[i][1].length; j++) {
                    nmatch.push([r.match[i][0], r.match[i][1][j]]);
                }
            } else {
                nmatch.push(r.match[i]);
            }
        }
    }
    r.match = nmatch;

    if (r.blocks && r.blocks.length > 0) {
        //reverse up the list
        //nest the functions
        //set pvaltemp to temp
        //return final function

        //block(lex(code,rules),"cropen","crclose","block",
        //(df)=>{return block(df,"propen","prclose","parameter")})
        let ptempval = ""
        for (let i = r.blocks.length - 1; i >= 0; i--) {
            const temp = "return block(tkns,\"" +
                r.blocks[i][0] + "\",\"" +
                r.blocks[i][1] + "\",\"" +
                r.blocks[i][2] + "\",r" +
                (ptempval ? (",(tkns)=>{" + (r.blocks[i][3] ? "tkns = " + r.blocks[i][3].toString() + ";" : "") + ptempval + "}") : "") + ")"
            ptempval = temp;
        }
        r.dblock = new Function(block.toString()+"\n"+"return (tkns,r)=>{" + ptempval + "}")()
    }

    if (r.parser && r.parser.length > 0) {
        //normalize input match
        for (let i = 0; i < r.parser.length; i++) {
            for (let j = 1; j < r.parser[i].length; j++) {
                if (typeof r.parser[i][j] == "string") {
                    r.parser[i][j] = [r.parser[i][j]]
                }
            }
        }
    }

    return r;
}
function tokenlines(sta, r) {
    let boffer = [{ type: "unsear", raw: sta, value: sta }];
    if (r.ignore && r.ignore.includes(sta)) {
        boffer[0].type = "ignored";
        return boffer;
    } else {
        for (let i = 0; i < r.match.length; i++) {
            //if match then
            //  recurse
            //  mixlists
            //  break

            if (sta.search(r.match[i][1]) > -1) {
                const result = sta.search(r.match[i][1]);
                let front = tokenlines(sta.substring(0, result), r);

                if (!front.push) {
                    front = [{ type: "unsear", raw: front, value: front }];
                }

                const token = {
                    type: r.match[i][0],
                    raw: sta.substring(result, sta.length).match(r.match[i][1])[0],
                    value: r.callback[r.match[i][0]]
                        ? r.callback[r.match[i][0]](
                            sta.substring(result, sta.length).match(r.match[i][1])[0]
                        )
                        : sta.substring(result, sta.length).match(r.match[i][1])[0],
                };
                const back = tokenlines(
                    sta.substring(result, sta.length).replace(r.match[i][1], ""),
                    r
                );

                front.push(token);
                boffer = mixlist(front, back);

                const bofferaswell = [];
                for (let j = 0; j < boffer.length; j++) {
                    if (boffer[j].value != "") {
                        bofferaswell.push(
                            boffer[j].type == "unsear" && r.specresolve
                                ? r.specresolve(boffer[j])
                                : boffer[j]
                        );
                    }
                }
                boffer = bofferaswell;

                return boffer;
            }
        }
        return boffer;
    }
}
export function block(t, start, end, type, r, callback) {
    const ends = [];
    let record = [];
    let depth = 0;
    let past;

    let recording = false;

    for (let i = 0; i < t.length; i++) {
        if (t[i].type == end) {
            if (!recording) {
                if (r.errorcallback)
                    r.errorcallback(t[i], "unexpected-token", " '" + type + "' -blockgen")
            }
            if (depth == 1) {
                recording = false;
                ends.push({
                    type: type,
                    value: block(record, start, end, type, r, callback),
                    line: past.line,
                    constructor: { name: type },
                });
                record = [];
                depth--;
            }
            else {
                depth--;
            }
        }
        if (recording) {
            record.push(t[i]);
        } else {
            if (t[i].type != start && t[i].type != end) ends.push(t[i]);
        }
        if (t[i].type == start) {
            if (!recording) {
                past = t[i];
            }
            recording = true;
            depth++;
        }
    }
    if (recording) {
        if (r.errorcallback)
            r.errorcallback(past, "unexpected-end-of-input", "@ '" + type + "' -blockgen")
    }
    const cals = callback ? callback(ends) : ends
    return r.blockcallback ? r.blockcallback(cals, type) : cals;
}
