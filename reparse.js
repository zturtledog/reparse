//@author: confusedParrotFish/zturtledog
//@permissions: no redistribution without credit

export const lex = (code,rules)=>
  rules.linecount?
      countlines(tokenlines(code, rulemapr(rules)), 
        rulemapr(rules)):
      tokenlines(code, rulemapr(rules))

//a bit of util
function mixlist(a, b) {
  for (let i = 0; i < b.length; i++) {
    a.push(b[i]);
  }
  return a;
}

export function countlines(sta, r) {
  let nl = 1;
  let col = 0;
  for (let i = 0; i < sta.length; i++) {
    if (sta[i].type == r.linecount) {
      nl++;
      col = -1;
    }
    sta[i].line = nl;
    sta[i].col = col;
    col += sta[i].value.length;
  }
  return sta;
}

export function rulemapr(r) {
  let nmatch = [];
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
  return r;
}

export function tokenlines(sta, r) {
  let boffer = [{ type: "unsear", raw: sta, value: sta }];
  if (r.ignore.includes(sta)) {
    boffer[0].type = "ignored";
    return boffer;
  } else {
    for (let i = 0; i < r.match.length; i++) {
      //if match then
      //  recurse
      //  mixlists
      //  break

      if (sta.search(r.match[i][1]) > -1) {
        let result = sta.search(r.match[i][1]);
        let front = tokenlines(sta.substring(0, result), r);

        if (!front.push) {
          front = [{ type: "unsear", raw: front, value: front }];
        }

        let token = {
          type: r.match[i][0],
          raw: sta.substring(result, sta.length).match(r.match[i][1])[0],
          value: r.callback[r.match[i][0]]
            ? r.callback[r.match[i][0]](
                sta.substring(result, sta.length).match(r.match[i][1])[0]
              )
            : sta.substring(result, sta.length).match(r.match[i][1])[0],
        };
        let back = tokenlines(
          sta.substring(result, sta.length).replace(r.match[i][1], ""),
          r
        );

        front.push(token);
        boffer = mixlist(front, back);

        let bofferaswell = [];
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
