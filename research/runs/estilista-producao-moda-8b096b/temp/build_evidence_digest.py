import os, glob, json

temp_dir = r'C:/Users/paulo/OneDrive/Desktop/Paulo Tech LTDA/Nova pasta/research/runs/estilista-producao-moda-8b096b/temp'
claims_files = sorted(glob.glob(os.path.join(temp_dir, 'claims-*.json')))

all_claims = []
for cf in claims_files:
    with open(cf, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            if isinstance(data, list):
                all_claims.extend(data)
        except Exception:
            pass

high_claims = [c for c in all_claims if c.get('confidence') == 'high']
other_claims = [c for c in all_claims if c.get('confidence') != 'high']
other_claims.sort(key=lambda x: (len(x.get('numbers', [])) > 0, len(x.get('quoted_support', ''))), reverse=True)

selected = (high_claims + other_claims)[:105]

groups = {
    '1. Papel e Responsabilidades da Estilista na Produção de Moda': [],
    '2. Tarefas por Etapa do Processo de Produção (da Pesquisa à Produção)': [],
    '3. Interfaces com Outras Funções (Modelagem, Pilotagem, Encaixe/Corte, Facção, Comercial e Fornecedores)': [],
    '4. Dores da Estilista no Processo e Impactos de Tecnologia (PLM, CAD 3D, IA e Sustentabilidade)': []
}

for c in selected:
    txt = (c.get('claim', '') + ' ' + c.get('stance_target', '')).lower()
    if any(k in txt for k in ['dor', 'atraso', 'cancelamento', 'sobrecarga', 'insustentabilidade', 'plm', '3d', 'midjourney', 'ia ', 'artificial', 'custo elevado', 'bloqueio', 'erro', 'retrabalho', 'fracass']):
        groups['4. Dores da Estilista no Processo e Impactos de Tecnologia (PLM, CAD 3D, IA e Sustentabilidade)'].append(c)
    elif any(k in txt for k in ['modelista', 'modelagem', 'piloto', 'fitting', 'prova', 'facção', 'facções', 'terceiriz', 'corte', 'encaixe', 'enfesto', 'fornecedor', 'comercial']):
        groups['3. Interfaces com Outras Funções (Modelagem, Pilotagem, Encaixe/Corte, Facção, Comercial e Fornecedores)'].append(c)
    elif any(k in txt for k in ['etapa', 'fase', 'pesquisa', 'briefing', 'croqui', 'ficha', 'mostruário', 'gate', 'cronograma', 'mix', 'coleção']):
        groups['2. Tarefas por Etapa do Processo de Produção (da Pesquisa à Produção)'].append(c)
    else:
        groups['1. Papel e Responsabilidades da Estilista na Produção de Moda'].append(c)

with open(os.path.join(temp_dir, 'consensus-claims.json'), 'r', encoding='utf-8') as f:
    consensus = json.load(f)

with open(os.path.join(temp_dir, 'contradiction-graph.json'), 'r', encoding='utf-8') as f:
    contradictions = json.load(f)

lines = ['# Evidence Digest — Responsabilidades, Tarefas e Dores da Estilista na Produção de Moda\n']
lines.append(f'Total de claims selecionadas: **{len(selected)}** (de {len(all_claims)} claims no corpus) + **{len(consensus)}** consensos multi-fonte + **{len(contradictions)}** disputas dialéticas.\n')

lines.append('## Consensos Multi-Fonte (`[consensus]`)\n')
for cc in consensus:
    srcs = ', '.join(f'[[{s}]]' for s in cc.get('sources', []))
    score = cc.get('independent_cluster_score', 3.0)
    claim_txt = cc.get('claim', '')
    lines.append(f'- **[consensus]** (Score de independência: {score}): {claim_txt}\n  Fontes: {srcs}\n')

lines.append('## Disputas Empíricas do Grafo de Contradições (`[contested]`)\n')
for cg in contradictions:
    cid = cg['cluster_id']
    fight = cg['fight']
    sa_pos = cg['side_a']['position']
    sa_srcs = ', '.join('[['+s+']]' for s in cg['side_a']['sources'])
    sb_pos = cg['side_b']['position']
    sb_srcs = ', '.join('[['+s+']]' for s in cg['side_b']['sources'])
    eqd = cg['evidence_quality_delta']
    lines.append(f'### Disputa: {cid}\n- **Questão:** {fight}\n- **Side A:** {sa_pos} ({sa_srcs})\n- **Side B:** {sb_pos} ({sb_srcs})\n- **Delta de Evidência:** {eqd}\n')

for gname, clist in groups.items():
    lines.append(f'### Atomic item: {gname}\n')
    for c in clist:
        ev = c.get('evidence_type', 'empirical')
        conf = c.get('confidence', 'medium')
        nums = ', '.join(c.get('numbers', []))
        num_str = f' | Números: `{nums}`' if nums else ''
        q = c.get('quoted_support', '').replace('\n', ' ').strip()
        sid = c.get('source_note_id', '')
        ctext = c.get('claim', '')
        lines.append(f'- {ctext} ({ev}, confidence={conf}{num_str})\n  > "{q}"\n  [[{sid}]]\n')

out_file = os.path.join(temp_dir, 'evidence-digest.md')
with open(out_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Successfully wrote evidence-digest.md with {len(selected)} claims')
