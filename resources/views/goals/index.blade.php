<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Goal Tracker</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; color: #333; min-height: 100vh; }
        .container { max-width: 700px; margin: 0 auto; padding: 2rem 1rem; }
        h1 { text-align: center; margin-bottom: 2rem; color: #1a1a2e; }

        /* Form */
        .add-form { background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 2rem; }
        .add-form h2 { font-size: 1.1rem; margin-bottom: 1rem; }
        .form-row { display: flex; gap: .75rem; flex-wrap: wrap; }
        .form-row input { flex: 1; padding: .6rem .8rem; border: 1px solid #ddd; border-radius: 8px; font-size: .95rem; }
        .form-row input:focus { outline: none; border-color: #6c63ff; }
        .btn { padding: .6rem 1.2rem; border: none; border-radius: 8px; cursor: pointer; font-size: .95rem; font-weight: 600; }
        .btn-primary { background: #6c63ff; color: #fff; }
        .btn-primary:hover { background: #5a52d5; }
        .btn-danger { background: #ff6b6b; color: #fff; font-size: .8rem; padding: .4rem .8rem; }
        .btn-danger:hover { background: #e05555; }
        .btn-update { background: #38b000; color: #fff; font-size: .8rem; padding: .4rem .8rem; }
        .btn-update:hover { background: #2d8f00; }

        /* Cards */
        .goal-card { background: #fff; border-radius: 12px; padding: 1.2rem 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .goal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .6rem; }
        .goal-title { font-weight: 700; font-size: 1.05rem; }
        .goal-meta { font-size: .85rem; color: #888; }
        .progress-bar { background: #e9ecef; border-radius: 999px; height: 22px; overflow: hidden; margin-bottom: .6rem; position: relative; }
        .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #6c63ff, #38b000); transition: width .3s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; }
        .progress-text { font-size: .75rem; color: #fff; font-weight: 700; }
        .goal-actions { display: flex; gap: .5rem; align-items: center; }
        .goal-actions input { width: 70px; padding: .3rem .5rem; border: 1px solid #ddd; border-radius: 6px; font-size: .85rem; }
        .empty { text-align: center; color: #aaa; padding: 2rem; }

        .errors { background: #fff0f0; border: 1px solid #ffcccc; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
        .errors li { color: #cc0000; font-size: .9rem; margin-left: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Goal Tracker</h1>

        @if ($errors->any())
            <div class="errors">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        {{-- Add Goal Form --}}
        <div class="add-form">
            <h2>Add New Goal</h2>
            <form action="{{ route('goals.store') }}" method="POST">
                @csrf
                <div class="form-row">
                    <input type="text" name="title" placeholder="Goal title" value="{{ old('title') }}" required>
                    <input type="number" name="target" placeholder="Target" value="{{ old('target') }}" min="1" required style="max-width:100px;">
                    <input type="text" name="unit" placeholder="Unit (e.g. km)" value="{{ old('unit') }}" style="max-width:120px;">
                    <button type="submit" class="btn btn-primary">Add</button>
                </div>
            </form>
        </div>

        {{-- Goal List --}}
        @forelse ($goals as $goal)
            <div class="goal-card">
                <div class="goal-header">
                    <span class="goal-title">{{ $goal->title }}</span>
                    <span class="goal-meta">{{ $goal->progress }} / {{ $goal->target }} {{ $goal->unit }}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {{ $goal->percentage() }}%">
                        @if($goal->percentage() > 10)
                            <span class="progress-text">{{ $goal->percentage() }}%</span>
                        @endif
                    </div>
                </div>
                <div class="goal-actions">
                    <form action="{{ route('goals.progress', $goal) }}" method="POST" style="display:flex; gap:.4rem; align-items:center;">
                        @csrf
                        @method('PATCH')
                        <input type="number" name="progress" value="{{ $goal->progress }}" min="0" max="{{ $goal->target }}">
                        <button type="submit" class="btn btn-update">Update</button>
                    </form>
                    <form action="{{ route('goals.destroy', $goal) }}" method="POST" onsubmit="return confirm('Delete this goal?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="btn btn-danger">Delete</button>
                    </form>
                </div>
            </div>
        @empty
            <div class="empty">No goals yet. Add one above! 🚀</div>
        @endforelse
    </div>
</body>
</html>
