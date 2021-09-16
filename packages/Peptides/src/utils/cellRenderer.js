export class AlignedSequenceCellRenderer extends DG.GridCellRenderer {
    get name() {
        return 'alignedSequenceCR';
    }

    get cellType() {
        return 'alignedSequence';
    }


    render(g, x, y, w, h, cell, style) {
        g.font = '15px monospace';
        g.textBaseline = 'top';
        let s = cell.cell.value;
        let cp = ChemPalette.get_datagrock()
        console.error(cp)
        g.font='13px monospace';
        for (let i = 0; i < Math.max(s.length,3); i++){
            g.fillStyle = `rgb(128,128,128)`;
            g.fillText(s[i], 2 + x + i * 7, y + 2);
        }
        for (let i = 3; i < s.length-4; i++) {
            if (s.charAt(i) in cp) {
                g.fillStyle = cp[s.charAt(i)];
                g.font='18px monospace';
                g.fillText('█', 2 + x + i * 7, y + 2)
                g.fillStyle = 'black';
                g.strokeStyle = 'white';
                g.lineWidth = 0.8
                g.font = '15px monospace';
                g.strokeText(s[i], 2 + x + i * 7, y + 2)
                g.fillText(s[i], 2 + x + i * 7, y + 2);


            }
            else{
                g.fillStyle = `rgb(128,128,128)`;
                g.fillText(s[i], 2 + x + i * 7, y + 2);
            }
        }
        g.font='13px monospace';
        for (let i = Math.max(0,s.length-4); i < s.length; i++){
            g.fillStyle = `rgb(128,128,128)`;
            g.fillText(s[i], 2 + x + i * 7, y + 2);
        }
    }

}