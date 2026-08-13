import re

def validate_password(password: str):
    errors = []
    if not password or len(password) < 8:
        errors.append('Password must be at least 8 characters long')
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', password):
        errors.append('Password must contain at least one lowercase letter')
    if not re.search(r'[0-9]', password):
        errors.append('Password must contain at least one digit')
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\'\:"\\|,.<>\/?]', password):
        errors.append('Password must contain at least one special character')
    return len(errors) == 0, errors

def validate_email(email: str):
    email_regex = r'^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
    return re.match(email_regex, email) is not None

def calculate_dominant_emotion(counts, confidence_sums):
    max_count = -1
    dominant = 'neutral'
    dominant_avg_conf = -1

    for emotion, count in counts.items():
        avg_conf = confidence_sums[emotion] / count if count > 0 else 0
        if count > max_count or (count == max_count and avg_conf > dominant_avg_conf):
            max_count = count
            dominant = emotion
            dominant_avg_conf = avg_conf
    return dominant

def calculate_stability_score(detections):
    if len(detections) <= 1:
        return 100.0
    
    face_groups = {}
    for d in detections:
        fid = d.get('face_id') or 1
        if fid not in face_groups:
            face_groups[fid] = []
        face_groups[fid].append(d)
        
    total_score = 0
    valid_faces = 0
    
    for fid, group_det in face_groups.items():
        if len(group_det) <= 1:
            total_score += 100.0
            valid_faces += 1
            continue
            
        sorted_det = sorted(group_det, key=lambda x: x['timestamp'])
        changes = 0
        for i in range(1, len(sorted_det)):
            if sorted_det[i]['emotion'].lower() != sorted_det[i - 1]['emotion'].lower():
                changes += 1
                
        score = (1 - (changes / len(sorted_det))) * 100
        total_score += score
        valid_faces += 1
        
    final_score = total_score / valid_faces if valid_faces > 0 else 100.0
    return round(final_score, 2)

def calculate_emotion_stats(detections):
    if not detections or len(detections) == 0:
        return {
            "happy_percentage": 0, "sad_percentage": 0, "angry_percentage": 0,
            "fear_percentage": 0, "surprised_percentage": 0, "disgust_percentage": 0,
            "neutral_percentage": 0, "dominant_emotion": 'neutral',
            "average_confidence": 0, "stability_score": 100, "total_detections": 0
        }

    total = len(detections)
    emotions = ['happy', 'sad', 'angry', 'fear', 'surprised', 'disgust', 'neutral']
    counts = {e: 0 for e in emotions}
    confidence_sums = {e: 0.0 for e in emotions}

    total_confidence = 0.0
    for d in detections:
        emotion = d['emotion'].lower()
        if emotion in counts:
            counts[emotion] += 1
            confidence_sums[emotion] += d['confidence']
        total_confidence += d['confidence']

    percentages = {}
    for e in emotions:
        percentages[f"{e}_percentage"] = round((counts[e] / total) * 100, 2)

    dominant_emotion = calculate_dominant_emotion(counts, confidence_sums)
    average_confidence = round((total_confidence / total) * 100, 2)
    stability_score = calculate_stability_score(detections)

    return {
        **percentages,
        "dominant_emotion": dominant_emotion,
        "average_confidence": average_confidence,
        "stability_score": stability_score,
        "total_detections": total
    }
