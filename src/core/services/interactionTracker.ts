// Core service for tracking user interactions
import { supabase } from '@/core/database/supabase';

export type InteractionType = 
  | 'view' | 'save' | 'click' | 'like' | 'dislike' | 'hide' 
  | 'share' | 'navigate' | 'call' | 'website' | 'search' 
  | 'filter' | 'scroll_past' | 'hover' | 'quick_view' 
  | 'compare' | 'review_start' | 'review_submit';

export interface InteractionMetadata {
  // Context data
  page?: string;                    // 'home', 'search', 'place-detail', etc.
  source?: string;                  // 'recommendation', 'search', 'trending', etc.
  position?: number;                // Position in list (for ranking analysis)
  search_query?: string;            // What user searched for
  filters_applied?: string[];       // Active filters
  
  // User behavior data
  time_spent_ms?: number;           // How long they spent
  scroll_depth?: number;            // How far they scrolled (0-1)
  click_coordinates?: {x: number, y: number}; // Where they clicked
  
  // Recommendation context
  algorithm?: string;               // Which algorithm recommended this
  recommendation_score?: number;    // Original recommendation score
  similar_places?: string[];        // Other places shown together
  
  // Session context
  session_duration_ms?: number;     // How long in current session
  previous_action?: string;         // What they did before this
  device_type?: 'desktop' | 'mobile' | 'tablet';
  
  // Additional context
  [key: string]: unknown;               // Flexible for future needs
}

class InteractionTracker {
  private sessionId: string | null = null;
  private sessionStart: Date | null = null;
  private lastAction: string | null = null;
  private pageStartTime: Date | null = null;

  constructor() {
    this.initializeSession();
  }

  private initializeSession() {
    // Create new session ID for this browser session
    this.sessionId = crypto.randomUUID();
    this.sessionStart = new Date();
    this.pageStartTime = new Date();
    
    // Store in sessionStorage to persist across page reloads
    if (typeof window !== 'undefined' && this.sessionId) {
      sessionStorage.setItem('interaction_session_id', this.sessionId);
      sessionStorage.setItem('session_start', this.sessionStart.toISOString());
    }
  }

  private getSessionData() {
    const now = new Date();
    const sessionDuration = this.sessionStart 
      ? now.getTime() - this.sessionStart.getTime() 
      : 0;

    return {
      session_id: this.sessionId,
      session_duration_ms: sessionDuration,
      previous_action: this.lastAction
    };
  }

  async track(
    actionType: InteractionType,
    placeId?: string,
    metadata: InteractionMetadata = {}
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare interaction data
      const interactionData = {
        user_id: user?.id || null,
        place_id: placeId || null,
        action_type: actionType,
        session_id: this.sessionId,
        metadata: {
          ...metadata,
          ...this.getSessionData(),
          device_type: this.getDeviceType(),
          timestamp: new Date().toISOString(),
          page_time_ms: this.pageStartTime 
            ? new Date().getTime() - this.pageStartTime.getTime() 
            : 0
        }
      };

      // Store interaction in database
      const { error } = await supabase
        .from('user_interactions')
        .insert(interactionData);

      if (error) {
        console.error('Failed to track interaction:', error);
      } else {
        console.log(`✅ Tracked: ${actionType}`, placeId ? `for place ${placeId}` : '');
      }

      // Update last action for context
      this.lastAction = actionType;

    } catch (error) {
      console.error('Interaction tracking error:', error);
    }
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Convenience methods for common interactions
  async viewPlace(placeId: string, metadata: InteractionMetadata = {}) {
    return this.track('view', placeId, {
      ...metadata,
      page: metadata.page || 'place-detail'
    });
  }

  async clickPlace(placeId: string, position: number, source: string, metadata: InteractionMetadata = {}) {
    return this.track('click', placeId, {
      ...metadata,
      position,
      source,
      page: metadata.page || 'search-results'
    });
  }

  async savePlace(placeId: string, metadata: InteractionMetadata = {}) {
    return this.track('save', placeId, metadata);
  }

  async likePlace(placeId: string, metadata: InteractionMetadata = {}) {
    return this.track('like', placeId, metadata);
  }

  async dislikePlace(placeId: string, metadata: InteractionMetadata = {}) {
    return this.track('dislike', placeId, metadata);
  }

  async hidePlace(placeId: string, reason?: string, metadata: InteractionMetadata = {}) {
    return this.track('hide', placeId, {
      ...metadata,
      hide_reason: reason
    });
  }

  async searchAction(query: string, resultsCount: number, metadata: InteractionMetadata = {}) {
    return this.track('search', undefined, {
      ...metadata,
      search_query: query,
      results_count: resultsCount
    });
  }

  async applyFilters(filters: string[], metadata: InteractionMetadata = {}) {
    return this.track('filter', undefined, {
      ...metadata,
      filters_applied: filters
    });
  }

  async scrollPast(placeId: string, position: number, metadata: InteractionMetadata = {}) {
    return this.track('scroll_past', placeId, {
      ...metadata,
      position,
      action_type: 'passive' // Indicates this wasn't an active choice
    });
  }

  // Map interaction methods
  async panMap(bounds: {north: number; south: number; east: number; west: number} | null, metadata: InteractionMetadata = {}) {
    return this.track('navigate', undefined, {
      ...metadata,
      interaction_type: 'map_pan',
      map_bounds: bounds
    });
  }

  async zoomMap(zoomLevel: number, metadata: InteractionMetadata = {}) {
    return this.track('navigate', undefined, {
      ...metadata,
      interaction_type: 'map_zoom',
      zoom_level: zoomLevel
    });
  }

  // List tracking methods
  async trackListScroll(listType: string, metadata: InteractionMetadata = {}) {
    return this.track('scroll_past', undefined, {
      ...metadata,
      list_type: listType,
      interaction_type: 'list_scroll'
    });
  }

  // Track time spent on pages
  onPageStart() {
    this.pageStartTime = new Date();
  }

  onPageEnd(page: string) {
    if (this.pageStartTime) {
      const timeSpent = new Date().getTime() - this.pageStartTime.getTime();
      this.track('view', undefined, {
        page,
        time_spent_ms: timeSpent,
        action_type: 'page_time'
      });
    }
  }
}

// Singleton instance
export const interactionTracker = new InteractionTracker();

// React hook for easy usage
export function useInteractionTracker() {
  return {
    track: interactionTracker.track.bind(interactionTracker),
    viewPlace: interactionTracker.viewPlace.bind(interactionTracker),
    clickPlace: interactionTracker.clickPlace.bind(interactionTracker),
    savePlace: interactionTracker.savePlace.bind(interactionTracker),
    likePlace: interactionTracker.likePlace.bind(interactionTracker),
    dislikePlace: interactionTracker.dislikePlace.bind(interactionTracker),
    hidePlace: interactionTracker.hidePlace.bind(interactionTracker),
    searchAction: interactionTracker.searchAction.bind(interactionTracker),
    applyFilters: interactionTracker.applyFilters.bind(interactionTracker),
    scrollPast: interactionTracker.scrollPast.bind(interactionTracker),
    panMap: interactionTracker.panMap.bind(interactionTracker),
    zoomMap: interactionTracker.zoomMap.bind(interactionTracker),
    trackListScroll: interactionTracker.trackListScroll.bind(interactionTracker)
  };
}