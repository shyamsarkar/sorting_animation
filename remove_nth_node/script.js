class RemoveNthNodeVisualizer {
  constructor() {
    this.values = [1, 2, 3, 4, 5];
    this.n = 2;
    this.steps = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.speed = 1000;
    this.timer = null;
    this.bindEvents();
    this.generateSteps();
  }

  bindEvents() {
    // Rebuild immediately whenever the user enters a valid list or n value.
    // Invalid intermediate text is left in place and explained below the inputs.
    document.getElementById('listInput').addEventListener('input', () => this.applyInputs());
    document.getElementById('nInput').addEventListener('input', () => this.applyInputs());
    document.getElementById('playBtn').addEventListener('click', () => this.isPlaying ? this.pause() : this.play());
    document.getElementById('prevBtn').addEventListener('click', () => { this.pause(); this.go(-1); });
    document.getElementById('nextBtn').addEventListener('click', () => { this.pause(); this.go(1); });
    document.getElementById('resetBtn').addEventListener('click', () => { this.pause(); this.currentStep = 0; this.render(); });
    document.getElementById('speedSelect').addEventListener('change', (event) => { this.speed = Number(event.target.value); if (this.isPlaying) { this.pause(); this.play(); } });
  }

  applyInputs() {
    const error = document.getElementById('inputError');
    try {
      const raw = document.getElementById('listInput').value.trim();
      const values = JSON.parse(raw.startsWith('[') ? raw : `[${raw}]`);
      const n = Number(document.getElementById('nInput').value);
      if (!Array.isArray(values) || !values.length || !values.every(Number.isFinite)) throw new Error('Enter a non-empty list of numbers.');
      if (!Number.isInteger(n) || n < 1 || n > values.length) throw new Error(`n must be between 1 and ${values.length}.`);
      this.values = values; this.n = n; error.textContent = ''; this.pause(); this.generateSteps();
    } catch (err) { error.textContent = err.message || 'Enter valid values.'; }
  }

  snapshot(type, fast, slow, message, removed = null) {
    this.steps.push({ type, fast, slow, removed, message, result: removed === null ? null : this.values.filter((_, i) => i !== removed) });
  }

  generateSteps() {
    this.steps = [];
    let fast = -1, slow = -1;
    this.snapshot('init', fast, slow, 'Create a dummy node pointing to the head. Both fast and slow start at dummy.');
    for (let move = 1; move <= this.n; move++) {
      fast++;
      this.snapshot('advance', fast, slow, `Move fast ahead ${move} of ${this.n} step${move === 1 ? '' : 's'}; it is now at ${this.nameFor(fast)}.`);
    }
    while (fast < this.values.length - 1) {
      fast++; slow++;
      this.snapshot('walk', fast, slow, `Move both pointers: fast is at ${this.nameFor(fast)}, and slow is at ${this.nameFor(slow)}.`);
    }
    const removed = slow + 1;
    this.snapshot('remove', fast, slow, `fast is at the last node, so slow is just before ${this.nameFor(removed)}. Set slow.next = slow.next.next to unlink it.`, removed);
    this.snapshot('finish', fast, slow, `Done. The ${this.n}th node from the end (${this.values[removed]}) has been removed.`, removed);
    this.currentStep = 0; this.render();
  }

  nameFor(index) { return index === -1 ? 'dummy' : `node ${index} (${this.values[index]})`; }

  render() {
    const step = this.steps[this.currentStep]; if (!step) return;
    const display = document.getElementById('listDisplay'); display.replaceChildren();
    const showRemoved = step.removed === null || step.type === 'remove';
    const nodes = [{ value: 'D', index: -1, dummy: true }, ...this.values.map((value, index) => ({ value, index }))];
    nodes.forEach((node, position) => {
      if (node.index === step.removed && !showRemoved) return;
      const wrap = document.createElement('div'); wrap.className = 'rn-node-wrap';
      const box = document.createElement('div'); box.className = `rn-node${node.dummy ? ' dummy' : ''}`;
      if (node.index === step.fast) box.classList.add('fast');
      if (node.index === step.slow) box.classList.add('slow');
      if (node.index === step.removed) box.classList.add('removing');
      box.textContent = node.value;
      const label = document.createElement('span'); label.className = 'rn-index'; label.textContent = node.dummy ? 'dummy' : `index ${node.index}`;
      wrap.append(box, label);
      if (node.index === step.fast || node.index === step.slow) {
        const pointer = document.createElement('span'); pointer.className = 'rn-pointer';
        pointer.textContent = `${node.index === step.fast ? 'fast' : ''}${node.index === step.fast && node.index === step.slow ? ' · ' : ''}${node.index === step.slow ? 'slow' : ''}`;
        wrap.append(pointer);
      }
      display.append(wrap);
      const nextVisible = nodes.slice(position + 1).find((candidate) => candidate.index !== step.removed || showRemoved);
      if (nextVisible) { const arrow = document.createElement('span'); arrow.className = 'rn-arrow'; arrow.textContent = '→'; display.append(arrow); }
    });
    const value = (index) => index === -1 ? 'dummy' : String(this.values[index]);
    document.getElementById('fastValue').textContent = value(step.fast);
    document.getElementById('slowValue').textContent = value(step.slow);
    document.getElementById('targetValue').textContent = step.removed === null ? '—' : String(this.values[step.removed]);
    document.getElementById('explanation').textContent = step.message;
    const result = document.getElementById('resultBox');
    result.classList.toggle('show', step.result !== null);
    document.getElementById('resultList').textContent = step.result ? `[${step.result.join(', ')}]` : '';
    document.getElementById('stepCount').textContent = this.currentStep + 1;
    document.getElementById('totalSteps').textContent = this.steps.length;
    document.getElementById('progressFill').style.width = `${((this.currentStep + 1) / this.steps.length) * 100}%`;
    document.getElementById('prevBtn').disabled = this.currentStep === 0;
    document.getElementById('nextBtn').disabled = this.currentStep === this.steps.length - 1;
  }

  go(change) { this.currentStep = Math.max(0, Math.min(this.steps.length - 1, this.currentStep + change)); this.render(); }
  play() { if (this.currentStep === this.steps.length - 1) this.currentStep = 0; this.isPlaying = true; this.updatePlay(); this.timer = setInterval(() => { if (this.currentStep === this.steps.length - 1) this.pause(); else this.go(1); }, this.speed); }
  pause() { this.isPlaying = false; clearInterval(this.timer); this.timer = null; this.updatePlay(); }
  updatePlay() { document.getElementById('playIcon').textContent = this.isPlaying ? '⏸' : '▶'; document.getElementById('playText').textContent = this.isPlaying ? 'Pause' : 'Play'; }
}
document.addEventListener('DOMContentLoaded', () => new RemoveNthNodeVisualizer());
